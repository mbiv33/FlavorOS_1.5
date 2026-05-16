import base64
import json
import logging
import os
import uuid
from asyncio import Event
from binascii import Error as BinasciiError
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

import httpx
import nats
import psycopg
from psycopg.rows import dict_row
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())
log = logging.getLogger("app-api")


POSTGRES_URL = os.getenv("POSTGRES_URL", "postgres://flavor:flavor@postgres:5432/flavor")
NATS_URL = os.getenv("NATS_URL", "nats://nats:4222")
CLIENT_ID = os.getenv("FLAVOROS_CLIENT_ID", "marcus")
VAULT_PATH = Path(os.getenv("VAULT_PATH", "/vault"))
GMAIL_ACCESS_TOKEN = os.getenv("GMAIL_ACCESS_TOKEN", "")
GMAIL_ACCESS_TOKEN_FILE = os.getenv("GMAIL_ACCESS_TOKEN_FILE", "")
GMAIL_REFRESH_TOKEN = os.getenv("GMAIL_REFRESH_TOKEN", "")
GMAIL_REFRESH_TOKEN_FILE = os.getenv("GMAIL_REFRESH_TOKEN_FILE", "")
GOOGLE_OAUTH_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")
GOOGLE_OAUTH_CLIENT_ID_FILE = os.getenv("GOOGLE_OAUTH_CLIENT_ID_FILE", "")
GOOGLE_OAUTH_CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
GOOGLE_OAUTH_CLIENT_SECRET_FILE = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET_FILE", "")
WORK_ORDER_SCHEMA_VERSION = "flavoros.work_order.v1"


class AppState:
    db: psycopg.AsyncConnection | None = None
    nc = None
    report_subscription = None
    shutdown = Event()


state = AppState()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


def summarize_report(content: str) -> str:
    compact = " ".join(content.strip().split())
    if not compact:
        return "Empty agent report."
    return compact[:280]


def normalize_vault_relative(path: str | None) -> str:
    if not path:
        return ""
    cleaned = path.strip().lstrip("/")
    if cleaned.startswith("vault/"):
        cleaned = cleaned[len("vault/") :]
    return cleaned


def build_work_order_message(
    *,
    work_order_id: str,
    target_agent: str,
    skill: str,
    task_type: str,
    priority: str,
    requires_approval: bool,
    artifact_target_path: str,
    source: dict,
    source_refs: dict,
    context_summary: str,
    inputs: dict,
) -> dict:
    return {
        "schema_version": WORK_ORDER_SCHEMA_VERSION,
        "work_order_id": work_order_id,
        "client_id": CLIENT_ID,
        "source": source,
        "source_agent": "khadijah",
        "target_agent": target_agent,
        "skill": skill,
        "task_type": task_type,
        "priority": priority,
        "requires_approval": requires_approval,
        "deliverable": {
            "type": "readiness_artifact",
            "artifact_target_path": artifact_target_path,
            "requested_output": "Inbox triage brief and draft response packet",
        },
        "source_refs": source_refs,
        "context": {
            "summary": context_summary,
        },
        "inputs": inputs,
        "requested_at": now_iso(),
        "id": work_order_id,
        "args": inputs,
    }


def read_secret_value(value: str, file_path: str) -> str:
    if value:
        return value.strip()
    if file_path:
        path = Path(file_path)
        if path.exists():
            return path.read_text().strip()
    return ""


def gmail_internal_date_to_iso(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return datetime.fromtimestamp(int(value) / 1000, tz=timezone.utc).isoformat()
    except (TypeError, ValueError):
        return None


def gmail_headers_map(payload: dict) -> dict:
    headers = payload.get("headers", [])
    if isinstance(headers, dict):
        return headers
    mapped = {}
    for header in headers:
        name = header.get("name")
        value = header.get("value")
        if name:
            mapped[name] = value
    return mapped


def decode_gmail_body(payload: dict) -> str:
    candidates = []
    if payload.get("body", {}).get("data"):
        candidates.append(payload["body"]["data"])
    for part in payload.get("parts", []) or []:
        body = part.get("body", {})
        if body.get("data"):
            candidates.append(body["data"])

    for encoded in candidates:
        try:
            padded = encoded + "=" * (-len(encoded) % 4)
            decoded = base64.urlsafe_b64decode(padded.encode()).decode("utf-8", errors="ignore").strip()
            if decoded:
                return decoded
        except (BinasciiError, ValueError):
            continue
    return ""


def render_artifact_markdown(
    *,
    artifact_id: str,
    title: str,
    created_by: str,
    artifact_type: str,
    status: str,
    requires_approval: bool,
    related_item_id: str | None,
    work_order_id: str,
    report_id: str,
    summary: str,
    content: str,
) -> str:
    approval_text = "yes" if requires_approval else "no"
    related_item = related_item_id or ""
    return f"""---
artifact_id: {artifact_id}
client_id: {CLIENT_ID}
created_at: {now_iso()}
created_by: {created_by}
artifact_type: {artifact_type}
status: {status}
requires_approval: {"true" if requires_approval else "false"}
related_sigmas: []
related_normalized_item_id: {related_item}
source_work_order_id: {work_order_id}
source_report_id: {report_id}
---

# {title}

## Summary

{summary}

## Prepared Output

{content}

## Approval Needed

- Required: {approval_text}
- Approval owner: khadijah
- Work order: {work_order_id}

## Follow-Up Update

Persisted from agent report `{report_id}`.
"""


async def fetch_all(query: str, params: tuple = ()) -> list[dict]:
    assert state.db is not None
    async with state.db.cursor(row_factory=dict_row) as cur:
        await cur.execute(query, params)
        return await cur.fetchall()


async def fetch_one(query: str, params: tuple = ()) -> dict | None:
    rows = await fetch_all(query, params)
    return rows[0] if rows else None


async def execute(query: str, params: tuple = ()) -> None:
    assert state.db is not None
    async with state.db.cursor() as cur:
        await cur.execute(query, params)


async def get_context_account(provider: str) -> dict | None:
    return await fetch_one(
        """
        SELECT context_account_id, account_alias, connection_status
        FROM context_accounts
        WHERE client_id = %s AND provider = %s
        ORDER BY created_at ASC
        LIMIT 1
        """,
        (CLIENT_ID, provider),
    )


async def mark_context_account_sync_success(context_account_id: str) -> None:
    await execute(
        """
        UPDATE context_accounts
        SET connection_status = 'healthy',
            last_sync_at = NOW(),
            last_error_at = NULL,
            last_error_summary = NULL,
            updated_at = NOW()
        WHERE context_account_id = %s
        """,
        (context_account_id,),
    )


async def mark_context_account_sync_error(context_account_id: str | None, summary: str) -> None:
    if not context_account_id:
        return
    await execute(
        """
        UPDATE context_accounts
        SET last_error_at = NOW(),
            last_error_summary = %s,
            updated_at = NOW()
        WHERE context_account_id = %s
        """,
        (summary[:500], context_account_id),
    )


async def upsert_oauth_account_status(
    *,
    context_account_id: str,
    scopes: list[str] | None = None,
    token_expires_at: str | None = None,
    refresh_status: str = "unknown",
    external_account_identifier: str | None = None,
    last_refreshed_at: str | None = None,
    consented_at: str | None = None,
    secret_ref: str | None = None,
) -> None:
    oauth_account_id = f"oauth-{context_account_id}"
    await execute(
        """
        INSERT INTO oauth_accounts (
            oauth_account_id, context_account_id, external_account_identifier, scopes_json,
            token_expires_at, refresh_status, last_refreshed_at, consented_at, secret_ref
        )
        VALUES (%s, %s, %s, %s::jsonb, %s::timestamptz, %s, %s::timestamptz, %s::timestamptz, %s)
        ON CONFLICT (oauth_account_id) DO UPDATE
        SET external_account_identifier = EXCLUDED.external_account_identifier,
            context_account_id = EXCLUDED.context_account_id,
            scopes_json = EXCLUDED.scopes_json,
            token_expires_at = EXCLUDED.token_expires_at,
            refresh_status = EXCLUDED.refresh_status,
            last_refreshed_at = EXCLUDED.last_refreshed_at,
            consented_at = COALESCE(oauth_accounts.consented_at, EXCLUDED.consented_at),
            secret_ref = EXCLUDED.secret_ref,
            updated_at = NOW()
        """,
        (
            oauth_account_id,
            context_account_id,
            external_account_identifier,
            json.dumps(scopes or []),
            token_expires_at,
            refresh_status,
            last_refreshed_at,
            consented_at,
            secret_ref,
        ),
    )


def build_secret_ref(provider: str, account_alias: str) -> str:
    return f"client_oauth.{CLIENT_ID}.{provider}.{account_alias}"


async def get_external_google_account_identifier(access_token: str) -> str | None:
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get("https://www.googleapis.com/oauth2/v2/userinfo", headers=headers)
            resp.raise_for_status()
        except httpx.HTTPError:
            return None
    data = resp.json()
    return data.get("email") or data.get("id")


async def record_gmail_oauth_status(
    *,
    context_account: dict | None,
    refresh_status: str,
    scopes: list[str] | None,
    token_expires_at: str | None,
    access_token: str | None = None,
) -> None:
    if context_account is None:
        return
    external_identifier = None
    if access_token:
        external_identifier = await get_external_google_account_identifier(access_token)
    await upsert_oauth_account_status(
        context_account_id=context_account["context_account_id"],
        scopes=scopes,
        token_expires_at=token_expires_at,
        refresh_status=refresh_status,
        external_account_identifier=external_identifier,
        last_refreshed_at=now_iso() if access_token else None,
        consented_at=None,
        secret_ref=build_secret_ref("gmail", context_account["account_alias"]),
    )


async def get_gmail_access_token() -> str:
    direct_access_token = read_secret_value(GMAIL_ACCESS_TOKEN, GMAIL_ACCESS_TOKEN_FILE)
    refresh_token = read_secret_value(GMAIL_REFRESH_TOKEN, GMAIL_REFRESH_TOKEN_FILE)
    oauth_client_id = read_secret_value(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_ID_FILE)
    oauth_client_secret = read_secret_value(GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_CLIENT_SECRET_FILE)
    context_account = await get_context_account("gmail")
    context_account_id = context_account["context_account_id"] if context_account else None

    if refresh_token and oauth_client_id and oauth_client_secret:
        async with httpx.AsyncClient(timeout=30) as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": oauth_client_id,
                    "client_secret": oauth_client_secret,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            token_resp.raise_for_status()
            token_data = token_resp.json()

        expires_in = token_data.get("expires_in")
        expires_at = None
        if isinstance(expires_in, int):
            expires_at = datetime.fromtimestamp(
                datetime.now(timezone.utc).timestamp() + expires_in,
                tz=timezone.utc,
            ).isoformat()

        if context_account_id:
            await record_gmail_oauth_status(
                context_account=context_account,
                refresh_status="healthy",
                scopes=token_data.get("scope", "").split(),
                token_expires_at=expires_at,
                access_token=token_data["access_token"],
            )

        return token_data["access_token"]

    if direct_access_token:
        if context_account_id:
            await record_gmail_oauth_status(
                context_account=context_account,
                refresh_status="access_token_only",
                scopes=[],
                token_expires_at=None,
                access_token=direct_access_token,
            )
        return direct_access_token

    if context_account_id:
        await record_gmail_oauth_status(
            context_account=context_account,
            refresh_status="missing_secret",
            scopes=[],
            token_expires_at=None,
            access_token=None,
        )

    raise RuntimeError(
        "gmail OAuth not configured: provide app-api gmail refresh token + Google OAuth client credentials, or a temporary gmail access token"
    )


async def persist_gmail_message(
    *,
    external_message_id: str,
    external_thread_id: str,
    subject: str,
    message_text: str,
    sender_name: str,
    sender_email: str,
    occurred_at: str | None,
    raw_payload: dict,
) -> dict:
    context_account = await get_context_account("gmail")
    if context_account is None:
        raise RuntimeError("gmail context account not found")

    provider_event_id = make_id("pev")
    normalized_thread_id = make_id("nth")
    normalized_item_id = make_id("nit")
    work_order_id = make_id("wo")
    preview = message_text[:180]
    route = "sinclair.comms"
    artifact_target_path = f"vault/15-Readiness/inbox-{work_order_id}.md"
    work_order_inputs = {
        "normalized_item_id": normalized_item_id,
        "subject": subject,
        "body": message_text,
        "route": route,
        "source": "gmail",
    }
    source_refs = {
        "normalized_item_id": normalized_item_id,
        "provider_event_id": provider_event_id,
        "external_thread_id": external_thread_id,
    }
    work_order_message = build_work_order_message(
        work_order_id=work_order_id,
        target_agent="sinclair",
        skill="inbound-communications-draft-response",
        task_type="inbound_communications_triage",
        priority="P0",
        requires_approval=True,
        artifact_target_path=artifact_target_path,
        source={"kind": "app-api", "channel": "gmail_sync"},
        source_refs=source_refs,
        context_summary="Inbound Gmail thread asking for triage and draft-response staging.",
        inputs=work_order_inputs,
    )

    assert state.db is not None
    async with state.db.cursor(row_factory=dict_row) as cur:
        await cur.execute(
            """
            INSERT INTO provider_events (
                provider_event_id, client_id, context_account_id, provider, external_object_id,
                external_thread_id, event_type, occurred_at, payload_json, payload_text_preview,
                dedupe_key, processing_status
            )
            VALUES (%s, %s, %s, 'gmail', %s, %s, 'message.received', %s, %s::jsonb, %s, %s, 'normalized')
            ON CONFLICT (context_account_id, dedupe_key) DO NOTHING
            RETURNING provider_event_id
            """,
            (
                provider_event_id,
                CLIENT_ID,
                context_account["context_account_id"],
                external_message_id,
                external_thread_id,
                occurred_at,
                json.dumps(raw_payload),
                preview,
                f"gmail:{external_message_id}",
            ),
        )
        inserted = await cur.fetchone()

    if inserted is None:
        return {"ok": True, "duplicate": True, "external_message_id": external_message_id}

    await execute(
        """
        INSERT INTO normalized_threads (
            normalized_thread_id, client_id, thread_kind, provider, external_thread_id,
            title, primary_counterparty, thread_status, latest_provider_event_id, last_activity_at
        )
        VALUES (%s, %s, 'conversation', 'gmail', %s, %s, %s, 'active', %s, NOW())
        """,
        (
            normalized_thread_id,
            CLIENT_ID,
            external_thread_id,
            subject,
            sender_name,
            provider_event_id,
        ),
    )

    await execute(
        """
        INSERT INTO normalized_items (
            normalized_item_id, client_id, normalized_thread_id, provider_event_id, provider,
            item_type, direction, received_at, from_entities_json, to_entities_json,
            subject, body_markdown, requires_response, requires_approval, suggested_route,
            origin_action_type, origin_write_target_json
        )
        VALUES (%s, %s, %s, %s, 'gmail', 'message', 'inbound', COALESCE(%s::timestamptz, NOW()),
                %s::jsonb, %s::jsonb, %s, %s, TRUE, TRUE, %s, 'gmail_reply_or_draft', %s::jsonb)
        """,
        (
            normalized_item_id,
            CLIENT_ID,
            normalized_thread_id,
            provider_event_id,
            occurred_at,
            json.dumps([{"name": sender_name, "email": sender_email}]),
            json.dumps([{"name": "Marcus", "email": "marcus@example.com"}]),
            subject,
            message_text,
            route,
            json.dumps({"thread_id": external_thread_id, "message_id": external_message_id}),
        ),
    )

    await execute(
        """
        INSERT INTO work_orders (
            work_order_id, client_id, normalized_item_id, source_agent, target_agent,
            task_type, priority, status, deliverable_type, requires_approval,
            artifact_target_path, input_json
        )
        VALUES (%s, %s, %s, 'khadijah', 'sinclair', 'inbound_communications_triage',
                'P0', 'queued', 'readiness_artifact', TRUE, %s, %s::jsonb)
        """,
        (
            work_order_id,
            CLIENT_ID,
            normalized_item_id,
            artifact_target_path,
            json.dumps(work_order_message),
        ),
    )

    if state.nc is not None:
        await state.nc.publish(
            "work_order.sinclair",
            json.dumps(work_order_message).encode(),
        )
        log.info("published work order subject=work_order.sinclair work_order_id=%s", work_order_id)

    return {
        "ok": True,
        "duplicate": False,
        "provider_event_id": provider_event_id,
        "normalized_item_id": normalized_item_id,
        "work_order_id": work_order_id,
    }


async def sync_gmail_messages(max_results: int = 5, query: str = "newer_than:7d") -> dict:
    context_account = await get_context_account("gmail")
    context_account_id = context_account["context_account_id"] if context_account else None
    try:
        access_token = await get_gmail_access_token()
    except Exception as exc:
        await mark_context_account_sync_error(context_account_id, str(exc))
        raise

    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            list_resp = await client.get(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages",
                headers=headers,
                params={"q": query, "maxResults": max_results},
            )
            list_resp.raise_for_status()
            list_data = list_resp.json()

            ingested = []
            duplicates = 0
            for message in list_data.get("messages", []):
                msg_id = message["id"]
                detail_resp = await client.get(
                    f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}",
                    headers=headers,
                    params={"format": "full"},
                )
                detail_resp.raise_for_status()
                detail = detail_resp.json()
                payload = detail.get("payload", {})
                headers_map = gmail_headers_map(payload)
                body_text = decode_gmail_body(payload) or detail.get("snippet", "")
                from_header = headers_map.get("From", "")
                sender_name = from_header.split("<")[0].strip().strip('"') or "Unknown Sender"
                sender_email = from_header.split("<")[-1].rstrip(">").strip() if "<" in from_header else from_header

                result = await persist_gmail_message(
                    external_message_id=detail["id"],
                    external_thread_id=detail.get("threadId", detail["id"]),
                    subject=headers_map.get("Subject", "Untitled Gmail message"),
                    message_text=body_text,
                    sender_name=sender_name or "Unknown Sender",
                    sender_email=sender_email or "unknown@example.com",
                    occurred_at=gmail_internal_date_to_iso(detail.get("internalDate")),
                    raw_payload=detail,
                )
                if result.get("duplicate"):
                    duplicates += 1
                else:
                    ingested.append(result)
        except httpx.HTTPError as exc:
            await mark_context_account_sync_error(context_account_id, str(exc))
            raise

    if context_account_id:
        await mark_context_account_sync_success(context_account_id)

    return {"ok": True, "ingested": ingested, "duplicates": duplicates}


async def create_artifact_from_report(
    *,
    work_order: dict,
    report_id: str,
    agent: str,
    summary: str,
    content: str,
    preferred_vault_file: str | None = None,
) -> tuple[str, str]:
    artifact_id = make_id("art")
    raw_target = preferred_vault_file or work_order.get("artifact_target_path") or f"vault/35-Reports/{agent}-{work_order['work_order_id']}.md"
    relative_target = normalize_vault_relative(raw_target)
    vault_file = VAULT_PATH / relative_target
    vault_file.parent.mkdir(parents=True, exist_ok=True)

    title = work_order.get("task_type", "agent-output").replace("_", " ").title()
    artifact_type = work_order.get("deliverable_type", "readiness_artifact")
    requires_approval = bool(work_order.get("requires_approval"))
    artifact_status = "prepared_for_review" if requires_approval else "prepared"

    markdown = render_artifact_markdown(
        artifact_id=artifact_id,
        title=title,
        created_by=agent,
        artifact_type=artifact_type,
        status=artifact_status,
        requires_approval=requires_approval,
        related_item_id=work_order.get("normalized_item_id"),
        work_order_id=work_order["work_order_id"],
        report_id=report_id,
        summary=summary,
        content=content,
    )
    vault_file.write_text(markdown)

    await execute(
        """
        INSERT INTO artifacts (
            artifact_id, client_id, artifact_type, source_work_order_id, source_report_id,
            vault_path, title, status, rendered_at, related_normalized_item_id, metadata_json
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s::jsonb)
        """,
        (
            artifact_id,
            CLIENT_ID,
            artifact_type,
            work_order["work_order_id"],
            report_id,
            relative_target,
            title,
            artifact_status,
            work_order.get("normalized_item_id"),
            json.dumps({"generated_by": agent}),
        ),
    )

    return artifact_id, relative_target


async def upsert_agent_report(report: dict) -> None:
    order_id = report.get("order_id") or report.get("work_order_id")
    if not order_id:
        log.warning("report missing order_id: %s", report)
        return

    content = report.get("content", "")
    agent = report.get("agent", "unknown")
    report_id = make_id("rpt")
    summary = report.get("summary") or summarize_report(content)
    report_status = report.get("status", "completed")
    requires_approval = bool(report.get("requires_approval", False))
    user_facing_response = report.get("user_facing_response") or summary
    report_vault_file = report.get("vault_file")
    work_order = await fetch_one(
        """
        SELECT work_order_id, normalized_item_id, deliverable_type, requires_approval, artifact_target_path, task_type
        FROM work_orders
        WHERE work_order_id = %s
        LIMIT 1
        """,
        (order_id,),
    )
    if work_order is None:
        log.warning("work order not found for report order_id=%s", order_id)
        return

    artifact_id, vault_relative_path = await create_artifact_from_report(
        work_order=work_order,
        report_id=report_id,
        agent=agent,
        summary=summary,
        content=content,
        preferred_vault_file=report_vault_file,
    )

    await execute(
        """
        INSERT INTO agent_reports (
            agent_report_id, work_order_id, agent, status, summary,
            user_facing_response, vault_file, requires_approval, report_json
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)
        """,
        (
            report_id,
            order_id,
            agent,
            report_status,
            summary,
            user_facing_response,
            vault_relative_path,
            requires_approval or bool(work_order.get("requires_approval")),
            json.dumps(report),
        ),
    )

    await execute(
        """
        UPDATE work_orders
        SET status = %s,
            updated_at = NOW()
        WHERE work_order_id = %s
        """,
        (report_status, order_id),
    )
    log.info("persisted report agent=%s order_id=%s artifact_id=%s", agent, order_id, artifact_id)


async def handle_report_message(msg) -> None:
    try:
        report = json.loads(msg.data.decode())
    except json.JSONDecodeError:
        log.warning("invalid report payload on %s", msg.subject)
        return

    log.info("received report on %s", msg.subject)
    try:
        await upsert_agent_report(report)
    except Exception:
        log.exception("failed to persist report on %s", msg.subject)


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok", "time": now_iso()})


async def dashboard_state(_: Request) -> JSONResponse:
    providers = await fetch_all(
        """
        SELECT provider, account_alias, connection_status
        FROM context_accounts
        WHERE client_id = %s
        ORDER BY provider
        """,
        (CLIENT_ID,),
    )
    inbox = await fetch_all(
        """
        SELECT provider, subject, body_markdown, suggested_route, requires_approval, requires_response, received_at, created_at
        FROM normalized_items
        WHERE client_id = %s
        ORDER BY received_at DESC NULLS LAST, created_at DESC
        LIMIT 8
        """,
        (CLIENT_ID,),
    )
    work_orders = await fetch_all(
        """
        SELECT work_order_id, target_agent, task_type, status, deliverable_type, created_at
        FROM work_orders
        WHERE client_id = %s
        ORDER BY created_at DESC
        LIMIT 8
        """,
        (CLIENT_ID,),
    )
    approvals = await fetch_all(
        """
        SELECT decision_owner, decision_state, exact_side_effect, risk_level, decided_at
        FROM approval_decisions
        WHERE client_id = %s
        ORDER BY decided_at DESC
        LIMIT 8
        """,
        (CLIENT_ID,),
    )
    outbound = await fetch_all(
        """
        SELECT provider, action_type, status, updated_at, last_error_summary
        FROM outbound_actions
        WHERE client_id = %s
        ORDER BY updated_at DESC
        LIMIT 8
        """,
        (CLIENT_ID,),
    )

    payload = {
        "providers": [
            {
                "name": row["provider"],
                "status": f"{row['connection_status'].replace('_', ' ')} via {row['account_alias']}",
            }
            for row in providers
        ],
        "metrics": [
            {"label": "Connected lanes", "value": len(providers)},
            {"label": "Normalized inbox items", "value": len(inbox)},
            {"label": "Pending approvals", "value": len([row for row in approvals if row["decision_state"] == "pending"])},
            {"label": "Outbound actions", "value": len(outbound)},
        ],
        "inbox": [
            {
                "title": row["subject"] or f"{row['provider']} item",
                "copy": (row["body_markdown"] or "No body captured.")[:220],
                "meta": f"Route: {row['suggested_route'] or 'unassigned'}",
                "badges": [
                    {"label": row["provider"], "tone": ""},
                    *([{"label": "requires response", "tone": "warn"}] if row["requires_response"] else []),
                    *([{"label": "approval required", "tone": "alert"}] if row["requires_approval"] else []),
                ],
            }
            for row in inbox
        ],
        "workOrders": [
            {
                "title": row["work_order_id"],
                "copy": f"{row['task_type']} for {row['target_agent']}",
                "meta": f"Deliverable: {row['deliverable_type']}",
                "badges": [
                    {"label": row["target_agent"], "tone": ""},
                    {"label": row["status"], "tone": "warn" if row["status"] != "completed" else ""},
                ],
            }
            for row in work_orders
        ],
        "approvals": [
            {
                "title": row["exact_side_effect"],
                "copy": f"Decision owner: {row['decision_owner']}",
                "meta": f"Risk: {row['risk_level']}",
                "badges": [
                    {"label": row["decision_state"], "tone": "alert" if row["decision_state"] == "pending" else "warn"},
                ],
            }
            for row in approvals
        ],
        "outbound": [
            {
                "title": f"{row['provider']} {row['action_type']}",
                "copy": row["last_error_summary"] or "Ready for stage, approval, or sync receipt.",
                "meta": f"Status: {row['status']}",
                "badges": [
                    {"label": row["action_type"], "tone": "warn" if row["status"] != "sent" else ""},
                ],
            }
            for row in outbound
        ],
    }
    return JSONResponse(payload)


async def mock_gmail_ingest(request: Request) -> JSONResponse:
    content_type = request.headers.get("content-type", "")
    body = await request.json() if content_type.startswith("application/json") else {}

    subject = body.get("subject", "Investor intro thread needs a scheduling answer")
    message_text = body.get(
        "body",
        "Hi Marcus, I would love to find a time next week to continue the conversation. What does Thursday look like?",
    )
    sender = body.get("from_email", "maya@example.com")
    sender_name = body.get("from_name", "Maya Chen")

    external_thread_id = body.get("external_thread_id", f"thread-{uuid.uuid4().hex[:10]}")
    external_message_id = body.get("external_message_id", f"msg-{uuid.uuid4().hex[:10]}")
    result = await persist_gmail_message(
        external_message_id=external_message_id,
        external_thread_id=external_thread_id,
        subject=subject,
        message_text=message_text,
        sender_name=sender_name,
        sender_email=sender,
        occurred_at=now_iso(),
        raw_payload={
            "id": external_message_id,
            "threadId": external_thread_id,
            "payload": {
                "headers": {
                    "Subject": subject,
                    "From": f"{sender_name} <{sender}>",
                    "To": "Marcus <marcus@example.com>",
                }
            },
            "snippet": message_text[:180],
        },
    )
    return JSONResponse(result, status_code=201 if not result.get("duplicate") else 200)


async def gmail_sync(request: Request) -> JSONResponse:
    try:
        max_results = int(request.query_params.get("max_results", "5"))
    except ValueError:
        return JSONResponse({"error": "invalid max_results"}, status_code=400)
    query = request.query_params.get("query", "newer_than:7d")

    try:
        result = await sync_gmail_messages(max_results=max_results, query=query)
    except httpx.HTTPStatusError as exc:
        return JSONResponse(
            {"error": "gmail request failed", "status_code": exc.response.status_code},
            status_code=502,
        )
    except RuntimeError as exc:
        return JSONResponse({"error": str(exc)}, status_code=400)

    return JSONResponse(result)


@asynccontextmanager
async def lifespan(_: Starlette):
    state.db = await psycopg.AsyncConnection.connect(POSTGRES_URL, autocommit=True)
    try:
        state.nc = await nats.connect(NATS_URL)
        state.report_subscription = await state.nc.subscribe("report.*", cb=handle_report_message)
        log.info("subscribed to report.*")
    except Exception:
        state.nc = None
    try:
        yield
    finally:
        state.shutdown.set()
        if state.report_subscription is not None:
            await state.report_subscription.unsubscribe()
        if state.nc is not None:
            await state.nc.close()
        if state.db is not None:
            await state.db.close()


app = Starlette(
    debug=False,
    routes=[
        Route("/health", health),
        Route("/api/dashboard-state", dashboard_state),
        Route("/api/mock/gmail-ingest", mock_gmail_ingest, methods=["POST"]),
        Route("/api/providers/gmail/sync", gmail_sync, methods=["POST"]),
    ],
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

"""Client Artifact meta validation and Approval Card projection helpers."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status

from app.models import Approval, Artifact
from app.schemas import ApprovalRead, ApprovalStakeChip, DraftEmailPreview, DraftEmailPreviewRow

DRAFT_EMAIL_TYPE = "draft_email"
COMMUNICATIONS_SEND_GOVERNED_ACTION = "send_communication_draft"

EMAIL_ITEM_TYPES = frozenset({"email", "email_sync_receipt"})


def artifact_type_from_meta(meta: dict[str, Any] | None) -> str | None:
    if not meta:
        return None
    value = meta.get("artifact_type")
    return value if isinstance(value, str) else None


def validate_client_artifact_meta(meta: dict[str, Any] | None) -> None:
    """Raise HTTP 422 when client artifact meta violates known type contracts."""
    if not meta:
        return
    artifact_type = artifact_type_from_meta(meta)
    if artifact_type == DRAFT_EMAIL_TYPE:
        _validate_draft_email_meta(meta)


def _validate_draft_email_meta(meta: dict[str, Any]) -> None:
    missing: list[str] = []
    for key in ("artifact_type", "channel", "to", "subject"):
        value = meta.get(key)
        if value is None or (isinstance(value, str) and not value.strip()):
            missing.append(key)
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Invalid draft_email artifact meta",
                "missing": missing,
            },
        )
    channel = meta.get("channel")
    if channel != "email":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "draft_email artifacts require channel=email"},
        )
    preview = meta.get("preview")
    if preview is not None and not isinstance(preview, dict):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "draft_email preview must be an object"},
        )
    if isinstance(preview, dict):
        rows = preview.get("rows")
        if rows is not None and not isinstance(rows, list):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"message": "draft_email preview.rows must be a list"},
            )
    source_links = meta.get("source_links")
    if source_links is not None and not isinstance(source_links, list):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "draft_email source_links must be a list"},
        )


def source_link_label_from_meta(meta: dict[str, Any] | None) -> str | None:
    if not meta:
        return None
    links = meta.get("source_links")
    if isinstance(links, list) and links:
        first = links[0]
        if isinstance(first, dict):
            label = first.get("label") or first.get("title")
            if isinstance(label, str) and label.strip():
                return label.strip()
        if isinstance(first, str) and first.strip():
            return first.strip()
    thread_id = meta.get("thread_id")
    if isinstance(thread_id, str) and thread_id.strip():
        return "Gmail thread"
    message_id = meta.get("message_id")
    if isinstance(message_id, str) and message_id.strip():
        return "Gmail message"
    return None


def _preview_rows_from_meta(preview_meta: dict[str, Any]) -> list[DraftEmailPreviewRow]:
    rows: list[DraftEmailPreviewRow] = []
    raw_rows = preview_meta.get("rows")
    if isinstance(raw_rows, list):
        for entry in raw_rows:
            if not isinstance(entry, dict):
                continue
            label = entry.get("label")
            value = entry.get("value")
            if (
                isinstance(label, str)
                and isinstance(value, str)
                and label.strip()
                and value.strip()
            ):
                rows.append(DraftEmailPreviewRow(label=label.strip(), value=value.strip()))
    return rows


def draft_email_preview_from_artifact(artifact: Artifact | None) -> DraftEmailPreview | None:
    if artifact is None:
        return None
    meta = artifact.meta or {}
    if artifact_type_from_meta(meta) != DRAFT_EMAIL_TYPE and meta.get("channel") != "email":
        return None
    preview_meta = meta.get("preview") if isinstance(meta.get("preview"), dict) else {}
    body = artifact.body or ""
    body_excerpt = (
        preview_meta.get("body_excerpt")
        if isinstance(preview_meta.get("body_excerpt"), str)
        else body[:240] if body else None
    )
    body_full = preview_meta.get("body") if isinstance(preview_meta.get("body"), str) else None
    inbound = preview_meta.get("inbound_summary") or preview_meta.get("inboundSummary")
    to_value = meta.get("to") or preview_meta.get("to")
    subject_value = meta.get("subject") or preview_meta.get("subject") or artifact.title
    rows = _preview_rows_from_meta(preview_meta)
    if not rows and to_value and subject_value:
        rows = [
            DraftEmailPreviewRow(label="To", value=str(to_value)),
            DraftEmailPreviewRow(label="Subject", value=str(subject_value)),
        ]
    return DraftEmailPreview(
        to=to_value if isinstance(to_value, str) else None,
        subject=subject_value if isinstance(subject_value, str) else None,
        body_excerpt=body_excerpt,
        inbound_summary=inbound if isinstance(inbound, str) else None,
        body=body_full or (body if body and not body_excerpt else None),
        rows=rows,
    )


def stakes_for_communication_draft(artifact: Artifact | None) -> list[ApprovalStakeChip]:
    if artifact is None:
        return []
    meta = artifact.meta or {}
    chips: list[ApprovalStakeChip] = []
    stakes = meta.get("stakes")
    if isinstance(stakes, dict):
        for kind, label in stakes.items():
            if label is None or label is False:
                continue
            if isinstance(label, bool) and label:
                chips.append(ApprovalStakeChip(kind=str(kind), label=str(kind).replace("_", " ")))
            elif isinstance(label, str) and label.strip():
                chips.append(ApprovalStakeChip(kind=str(kind), label=label.strip()))
        if chips:
            return chips
    chips.append(ApprovalStakeChip(kind="public-facing", label="Public-facing"))
    if meta.get("irreversible") or meta.get("send_window"):
        chips.append(ApprovalStakeChip(kind="irreversible", label="Send"))
    return chips


def project_approval_read(
    approval: Approval,
    artifact: Artifact | None,
) -> ApprovalRead:
    preview = None
    stakes: list[ApprovalStakeChip] = []
    source_link_label = None
    if artifact is not None:
        preview = draft_email_preview_from_artifact(artifact)
        if approval.governed_action == COMMUNICATIONS_SEND_GOVERNED_ACTION or (
            artifact.meta and artifact_type_from_meta(artifact.meta) == DRAFT_EMAIL_TYPE
        ):
            stakes = stakes_for_communication_draft(artifact)
            source_link_label = source_link_label_from_meta(artifact.meta)
    return ApprovalRead(
        id=approval.id,
        client_id=approval.client_id,
        artifact_id=approval.artifact_id,
        governed_action=approval.governed_action,
        reason=approval.reason,
        decision=approval.decision,
        decided_by=approval.decided_by,
        decided_at=approval.decided_at,
        created_at=approval.created_at,
        preview=preview,
        stakes=stakes,
        source_link_label=source_link_label,
    )

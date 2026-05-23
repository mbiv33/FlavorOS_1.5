"""Client DNA adoption — promotes an accepted candidate to durable GBrain memory.

Called by the DNA router when an operator accepts a ClientDnaCandidate.
Writes store_sigma (sigma_type=client_dna) and a second ingest as
category=client_dna_adopted so the candidate appears in IPM context packets.

Degrades gracefully when GBrain is in stub mode — adoption is recorded
relationally regardless.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditEvent, ClientDnaCandidate

logger = logging.getLogger(__name__)

PURGE_THRESHOLD = 3


async def adopt_candidate(
    db: Session,
    candidate: ClientDnaCandidate,
    gbrain: Any,
    actor_id: uuid.UUID | None = None,
) -> ClientDnaCandidate:
    """Promote an accepted candidate into GBrain durable memory."""
    now = datetime.now(timezone.utc)

    sigma_payload = {
        "domain": candidate.domain,
        "content": candidate.content,
        "confidence": candidate.confidence,
        "sweep_window": candidate.sweep_window,
        "candidate_id": str(candidate.id),
        "raw_data": candidate.raw_data,
    }

    try:
        sigma_result = await gbrain.store_sigma(
            client_id=candidate.client_id,
            sigma_type="client_dna",
            payload=sigma_payload,
        )
        if sigma_result.success:
            candidate.sigma_id = sigma_result.sigma_id
    except Exception as exc:
        logger.warning("store_sigma failed for candidate %s: %s", candidate.id, exc)

    try:
        await gbrain.ingest(
            client_id=candidate.client_id,
            category="client_dna_adopted",
            content=candidate.content,
            metadata={
                "domain": candidate.domain,
                "candidate_id": str(candidate.id),
                "sigma_id": candidate.sigma_id,
                "confidence": candidate.confidence,
            },
        )
    except Exception as exc:
        logger.warning("GBrain ingest (adopted) failed for candidate %s: %s", candidate.id, exc)

    candidate.status = "adopted"
    candidate.updated_at = now

    db.add(AuditEvent(
        client_id=candidate.client_id,
        actor_id=actor_id,
        action="dna.adopted",
        resource_type="client_dna_candidate",
        resource_id=candidate.id,
        detail={
            "domain": candidate.domain,
            "sigma_id": candidate.sigma_id,
            "gbrain_record_id": candidate.gbrain_record_id,
        },
    ))
    db.flush()
    return candidate


def reject_candidate(
    db: Session,
    candidate: ClientDnaCandidate,
    actor_id: uuid.UUID | None = None,
    note: str | None = None,
) -> ClientDnaCandidate:
    """Reject a candidate. Purge automatically at 3× unverified."""
    now = datetime.now(timezone.utc)
    candidate.verification_attempts += 1
    candidate.updated_at = now

    if candidate.verification_attempts >= PURGE_THRESHOLD:
        candidate.status = "purged"
        action = "dna.purged"
    else:
        candidate.status = "pending"
        action = "dna.rejected"

    db.add(AuditEvent(
        client_id=candidate.client_id,
        actor_id=actor_id,
        action=action,
        resource_type="client_dna_candidate",
        resource_id=candidate.id,
        detail={
            "domain": candidate.domain,
            "verification_attempts": candidate.verification_attempts,
            "note": note,
        },
    ))
    db.flush()
    return candidate

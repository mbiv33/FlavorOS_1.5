# Receipt Capture and Matching Protocol

## Header

- Owner agent: Maxine
- Supporting agent: Khadijah when blocked reimbursements or payable decisions need owner context
- Related skill: `receipt-capture-matching`

## Purpose

Capture receipt evidence, normalize OCR output, and match receipts to canonical transaction facts.

## Trigger

- Receipt upload
- Missing-receipt repair scan
- Reimbursement or payable validation

## Inputs

- receipt file refs, OCR output, financial transactions, merchant aliases, payable and reimbursement state

## Phase Contract

1. Receipt Capture: persist file and extraction metadata.
2. Candidate Match Scan: search probable transaction matches.
3. Match Resolution: confirm, reject, or route ambiguous matches.
4. Finance Propagation: update payable/reimbursement readiness.

## Artifacts

- receipt exception artifact when source evidence is missing or ambiguous
- reimbursement packet update when receipts unblock submission

## Approval Gates

- Not required for matching itself.
- Required downstream if the match unblocks payment, reimbursement, or dispute resolution.

## Failure Modes

- OCR failure: preserve file and route for review.
- No candidate transaction: create unresolved receipt exception.
- Multiple high-confidence candidates: do not auto-merge; escalate to review.

## Completion Signal

- Publish `report.maxine.receipt-matched`.


CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS client_accounts (
    client_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    default_authority_mode TEXT NOT NULL DEFAULT 'draft_only',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_profiles (
    client_id TEXT PRIMARY KEY REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    legal_name TEXT,
    preferred_name TEXT,
    title TEXT,
    birth_date DATE,
    gender TEXT,
    timezone TEXT NOT NULL,
    locale TEXT NOT NULL DEFAULT 'en-US',
    primary_email TEXT,
    primary_phone TEXT,
    primary_address_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    bio_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    onboarding_status TEXT NOT NULL DEFAULT 'pending',
    profile_notes_json JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (onboarding_status IN ('pending', 'partial', 'ready_for_auth', 'ready_for_sync', 'active', 'blocked', 'archived'))
);

CREATE TABLE IF NOT EXISTS client_contexts (
    context_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    context_key TEXT NOT NULL,
    context_type TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    context_status TEXT NOT NULL DEFAULT 'active',
    priority_order INTEGER NOT NULL DEFAULT 100,
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, context_key),
    CHECK (context_status IN ('active', 'pending', 'paused', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_client_contexts_client_priority
    ON client_contexts (client_id, priority_order, display_name);

CREATE TABLE IF NOT EXISTS context_accounts (
    context_account_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    context_id TEXT REFERENCES client_contexts(context_id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    account_alias TEXT NOT NULL,
    connection_status TEXT NOT NULL DEFAULT 'pending',
    last_sync_at TIMESTAMPTZ,
    last_error_at TIMESTAMPTZ,
    last_error_summary TEXT,
    capabilities_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, provider, account_alias)
);

CREATE INDEX IF NOT EXISTS idx_context_accounts_context
    ON context_accounts (context_id, provider, account_alias);

CREATE TABLE IF NOT EXISTS oauth_accounts (
    oauth_account_id TEXT PRIMARY KEY,
    context_account_id TEXT NOT NULL REFERENCES context_accounts(context_account_id) ON DELETE CASCADE,
    external_account_identifier TEXT,
    scopes_json JSONB NOT NULL DEFAULT '[]'::JSONB,
    token_expires_at TIMESTAMPTZ,
    refresh_status TEXT NOT NULL DEFAULT 'unknown',
    last_refreshed_at TIMESTAMPTZ,
    consented_at TIMESTAMPTZ,
    secret_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_events (
    provider_event_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    context_account_id TEXT NOT NULL REFERENCES context_accounts(context_account_id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    external_object_id TEXT NOT NULL,
    external_thread_id TEXT,
    event_type TEXT NOT NULL,
    occurred_at TIMESTAMPTZ,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    payload_text_preview TEXT,
    dedupe_key TEXT NOT NULL,
    processing_status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (context_account_id, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_provider_events_client_provider
    ON provider_events (client_id, provider, ingested_at DESC);

CREATE TABLE IF NOT EXISTS sync_checkpoints (
    sync_checkpoint_id TEXT PRIMARY KEY,
    context_account_id TEXT NOT NULL REFERENCES context_accounts(context_account_id) ON DELETE CASCADE,
    checkpoint_type TEXT NOT NULL,
    checkpoint_value TEXT NOT NULL,
    checkpoint_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (context_account_id, checkpoint_type)
);

CREATE TABLE IF NOT EXISTS normalized_threads (
    normalized_thread_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    thread_kind TEXT NOT NULL,
    provider TEXT NOT NULL,
    external_thread_id TEXT,
    title TEXT,
    primary_counterparty TEXT,
    thread_status TEXT NOT NULL DEFAULT 'active',
    latest_provider_event_id TEXT REFERENCES provider_events(provider_event_id) ON DELETE SET NULL,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_normalized_threads_client_activity
    ON normalized_threads (client_id, last_activity_at DESC);

CREATE TABLE IF NOT EXISTS normalized_items (
    normalized_item_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    normalized_thread_id TEXT REFERENCES normalized_threads(normalized_thread_id) ON DELETE SET NULL,
    provider_event_id TEXT NOT NULL REFERENCES provider_events(provider_event_id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    item_type TEXT NOT NULL,
    direction TEXT NOT NULL,
    received_at TIMESTAMPTZ,
    from_entities_json JSONB NOT NULL DEFAULT '[]'::JSONB,
    to_entities_json JSONB NOT NULL DEFAULT '[]'::JSONB,
    subject TEXT,
    body_markdown TEXT,
    requires_response BOOLEAN NOT NULL DEFAULT FALSE,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    suggested_route TEXT,
    origin_action_type TEXT,
    origin_write_target_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    normalization_version TEXT NOT NULL DEFAULT 'v1',
    classification_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_normalized_items_client_received
    ON normalized_items (client_id, received_at DESC);

CREATE TABLE IF NOT EXISTS financial_accounts (
    financial_account_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    context_id TEXT REFERENCES client_contexts(context_id) ON DELETE SET NULL,
    context_account_id TEXT REFERENCES context_accounts(context_account_id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    external_account_id TEXT,
    account_alias TEXT NOT NULL,
    account_kind TEXT NOT NULL,
    institution_name TEXT,
    display_name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    account_status TEXT NOT NULL DEFAULT 'active',
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, provider, account_alias),
    CHECK (account_kind IN ('bank', 'card', 'cash', 'loan', 'book', 'processor', 'clearing', 'other')),
    CHECK (account_status IN ('active', 'pending', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_financial_accounts_client_context
    ON financial_accounts (client_id, context_id, account_kind, display_name);

CREATE TABLE IF NOT EXISTS merchant_aliases (
    merchant_alias_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    raw_merchant TEXT NOT NULL,
    clean_merchant TEXT NOT NULL,
    merchant_group TEXT,
    confidence_score NUMERIC(5, 4) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, raw_merchant)
);

CREATE TABLE IF NOT EXISTS financial_transactions (
    financial_transaction_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    financial_account_id TEXT NOT NULL REFERENCES financial_accounts(financial_account_id) ON DELETE CASCADE,
    provider_event_id TEXT REFERENCES provider_events(provider_event_id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    external_transaction_id TEXT,
    external_pending_id TEXT,
    source_kind TEXT NOT NULL,
    transaction_direction TEXT NOT NULL,
    transaction_status TEXT NOT NULL DEFAULT 'posted',
    transaction_date DATE NOT NULL,
    posted_at TIMESTAMPTZ,
    amount_minor BIGINT NOT NULL,
    currency TEXT NOT NULL,
    raw_merchant TEXT,
    clean_merchant TEXT,
    description TEXT,
    category_hint TEXT,
    confidence_score NUMERIC(5, 4) NOT NULL DEFAULT 0.0,
    receipt_status TEXT NOT NULL DEFAULT 'missing',
    categorization_status TEXT NOT NULL DEFAULT 'needs_review',
    normalization_version TEXT NOT NULL DEFAULT 'v1',
    idempotency_key TEXT NOT NULL,
    immutable_hash TEXT NOT NULL,
    raw_data_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (financial_account_id, idempotency_key),
    UNIQUE (financial_account_id, immutable_hash),
    CHECK (source_kind IN ('provider_api', 'csv_import', 'receipt_match', 'manual_adjustment', 'write_back')),
    CHECK (transaction_direction IN ('debit', 'credit')),
    CHECK (transaction_status IN ('pending', 'posted', 'voided', 'reversed')),
    CHECK (receipt_status IN ('missing', 'matched', 'needs_review')),
    CHECK (categorization_status IN ('auto', 'confirmed', 'needs_review'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_transactions_external
    ON financial_transactions (provider, external_transaction_id)
    WHERE external_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_client_date
    ON financial_transactions (client_id, transaction_date DESC, posted_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_receipt_status
    ON financial_transactions (client_id, receipt_status, categorization_status, transaction_date DESC);

CREATE TABLE IF NOT EXISTS receipts (
    receipt_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    provider_event_id TEXT REFERENCES provider_events(provider_event_id) ON DELETE SET NULL,
    artifact_id TEXT,
    upload_channel TEXT NOT NULL,
    source_filename TEXT,
    file_path TEXT,
    file_hash TEXT NOT NULL,
    ocr_status TEXT NOT NULL DEFAULT 'pending',
    vendor TEXT,
    receipt_date DATE,
    total_amount_minor BIGINT,
    tax_amount_minor BIGINT,
    currency TEXT NOT NULL DEFAULT 'USD',
    line_items_json JSONB NOT NULL DEFAULT '[]'::JSONB,
    extraction_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, file_hash),
    CHECK (upload_channel IN ('email', 'sms', 'upload', 'forwarded', 'agent_prompt')),
    CHECK (ocr_status IN ('pending', 'completed', 'failed', 'needs_review'))
);

CREATE INDEX IF NOT EXISTS idx_receipts_client_status
    ON receipts (client_id, ocr_status, receipt_date DESC);

CREATE TABLE IF NOT EXISTS receipt_transaction_matches (
    receipt_transaction_match_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    receipt_id TEXT NOT NULL REFERENCES receipts(receipt_id) ON DELETE CASCADE,
    financial_transaction_id TEXT NOT NULL REFERENCES financial_transactions(financial_transaction_id) ON DELETE CASCADE,
    match_status TEXT NOT NULL DEFAULT 'proposed',
    match_confidence NUMERIC(5, 4) NOT NULL DEFAULT 0.0,
    matched_at TIMESTAMPTZ,
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (receipt_id, financial_transaction_id),
    CHECK (match_status IN ('proposed', 'confirmed', 'rejected', 'superseded'))
);

CREATE INDEX IF NOT EXISTS idx_receipt_transaction_matches_status
    ON receipt_transaction_matches (client_id, match_status, created_at DESC);

CREATE TABLE IF NOT EXISTS chart_of_accounts (
    ledger_account_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    context_id TEXT REFERENCES client_contexts(context_id) ON DELETE SET NULL,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    normal_balance TEXT NOT NULL,
    parent_ledger_account_id TEXT REFERENCES chart_of_accounts(ledger_account_id) ON DELETE SET NULL,
    account_status TEXT NOT NULL DEFAULT 'active',
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, account_code),
    CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense', 'contra')),
    CHECK (normal_balance IN ('debit', 'credit')),
    CHECK (account_status IN ('active', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_client_type
    ON chart_of_accounts (client_id, context_id, account_type, account_code);

CREATE TABLE IF NOT EXISTS ledger_entries (
    ledger_entry_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    accounting_date DATE NOT NULL,
    period_key TEXT NOT NULL,
    entry_status TEXT NOT NULL DEFAULT 'draft',
    description TEXT NOT NULL,
    reference_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_by_agent TEXT,
    approved_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, source_type, source_id),
    CHECK (source_type IN ('financial_transaction', 'invoice', 'payable', 'reimbursement', 'manual_adjustment', 'reconciliation')),
    CHECK (entry_status IN ('draft', 'posted', 'reversed', 'locked'))
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_client_period
    ON ledger_entries (client_id, period_key, accounting_date DESC, entry_status);

CREATE TABLE IF NOT EXISTS ledger_postings (
    ledger_posting_id TEXT PRIMARY KEY,
    ledger_entry_id TEXT NOT NULL REFERENCES ledger_entries(ledger_entry_id) ON DELETE CASCADE,
    ledger_account_id TEXT NOT NULL REFERENCES chart_of_accounts(ledger_account_id) ON DELETE RESTRICT,
    posting_type TEXT NOT NULL,
    amount_minor BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (posting_type IN ('debit', 'credit')),
    CHECK (amount_minor >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ledger_postings_entry
    ON ledger_postings (ledger_entry_id, posting_type, ledger_account_id);

CREATE TABLE IF NOT EXISTS budget_periods (
    budget_period_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    context_id TEXT REFERENCES client_contexts(context_id) ON DELETE SET NULL,
    period_key TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    period_status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, context_id, period_key),
    CHECK (period_status IN ('open', 'locked', 'archived'))
);

CREATE TABLE IF NOT EXISTS budget_lines (
    budget_line_id TEXT PRIMARY KEY,
    budget_period_id TEXT NOT NULL REFERENCES budget_periods(budget_period_id) ON DELETE CASCADE,
    ledger_account_id TEXT NOT NULL REFERENCES chart_of_accounts(ledger_account_id) ON DELETE RESTRICT,
    category_name TEXT NOT NULL,
    planned_amount_minor BIGINT NOT NULL,
    alert_threshold_pct NUMERIC(6, 3) NOT NULL DEFAULT 0.100,
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (budget_period_id, ledger_account_id)
);

CREATE TABLE IF NOT EXISTS budget_alerts (
    budget_alert_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    budget_line_id TEXT NOT NULL REFERENCES budget_lines(budget_line_id) ON DELETE CASCADE,
    period_key TEXT NOT NULL,
    actual_amount_minor BIGINT NOT NULL,
    projected_amount_minor BIGINT NOT NULL,
    variance_pct NUMERIC(8, 4) NOT NULL,
    alert_status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (alert_status IN ('open', 'acknowledged', 'resolved'))
);

CREATE INDEX IF NOT EXISTS idx_budget_alerts_client_status
    ON budget_alerts (client_id, alert_status, created_at DESC);

CREATE TABLE IF NOT EXISTS pending_action_candidates (
    pac_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    source_normalized_item_id TEXT REFERENCES normalized_items(normalized_item_id) ON DELETE SET NULL,
    source_provider_event_id TEXT REFERENCES provider_events(provider_event_id) ON DELETE SET NULL,
    source_agent TEXT NOT NULL,
    source_trigger_type TEXT NOT NULL,
    candidate_summary TEXT NOT NULL,
    candidate_scope TEXT NOT NULL DEFAULT 'unknown',
    state TEXT NOT NULL DEFAULT 'awaiting_ptq',
    time_score NUMERIC(4, 2) NOT NULL DEFAULT 0,
    crm_score NUMERIC(4, 2) NOT NULL DEFAULT 0,
    milestone_score NUMERIC(4, 2) NOT NULL DEFAULT 0,
    touch_score NUMERIC(4, 2) NOT NULL DEFAULT 0,
    cumulative_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
    last_touched_at TIMESTAMPTZ,
    hard_date TIMESTAMPTZ,
    current_ptq_id TEXT,
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (candidate_scope IN ('task', 'project', 'unknown')),
    CHECK (state IN ('awaiting_ptq', 'incubating', 'qualified', 'disqualified', 'expired', 'converted', 'purge_pending'))
);

CREATE INDEX IF NOT EXISTS idx_pacs_client_state_score
    ON pending_action_candidates (client_id, state, cumulative_score DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_pacs_hard_date
    ON pending_action_candidates (hard_date)
    WHERE hard_date IS NOT NULL;

CREATE TABLE IF NOT EXISTS qualification_checks (
    ptq_id TEXT PRIMARY KEY,
    pac_id TEXT NOT NULL REFERENCES pending_action_candidates(pac_id) ON DELETE CASCADE,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    qualification_type TEXT NOT NULL,
    condition_summary TEXT NOT NULL,
    resolution_mode TEXT NOT NULL,
    assigned_agent TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    tripwire_type TEXT,
    threshold_value NUMERIC(6, 2),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    approval_decision_id TEXT,
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (status IN ('open', 'waiting', 'met', 'failed', 'canceled'))
);

CREATE INDEX IF NOT EXISTS idx_ptq_pac_status
    ON qualification_checks (pac_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ptq_client_status
    ON qualification_checks (client_id, status, created_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'pending_action_candidates_current_ptq_id_fkey'
    ) THEN
        ALTER TABLE pending_action_candidates
        ADD CONSTRAINT pending_action_candidates_current_ptq_id_fkey
        FOREIGN KEY (current_ptq_id)
        REFERENCES qualification_checks(ptq_id)
        ON DELETE SET NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS work_orders (
    work_order_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    normalized_item_id TEXT REFERENCES normalized_items(normalized_item_id) ON DELETE SET NULL,
    source_agent TEXT NOT NULL,
    target_agent TEXT NOT NULL,
    task_type TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'P1',
    status TEXT NOT NULL DEFAULT 'queued',
    deliverable_type TEXT NOT NULL,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    artifact_target_path TEXT,
    input_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_orders_target_status
    ON work_orders (target_agent, status, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_reports (
    agent_report_id TEXT PRIMARY KEY,
    work_order_id TEXT NOT NULL REFERENCES work_orders(work_order_id) ON DELETE CASCADE,
    agent TEXT NOT NULL,
    status TEXT NOT NULL,
    summary TEXT NOT NULL,
    user_facing_response TEXT,
    vault_file TEXT,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    report_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_reports_work_order
    ON agent_reports (work_order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS artifacts (
    artifact_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    artifact_type TEXT NOT NULL,
    source_work_order_id TEXT REFERENCES work_orders(work_order_id) ON DELETE SET NULL,
    source_report_id TEXT REFERENCES agent_reports(agent_report_id) ON DELETE SET NULL,
    vault_path TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    rendered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    related_provider_event_id TEXT REFERENCES provider_events(provider_event_id) ON DELETE SET NULL,
    related_normalized_item_id TEXT REFERENCES normalized_items(normalized_item_id) ON DELETE SET NULL,
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artifacts_client_rendered
    ON artifacts (client_id, rendered_at DESC);

CREATE TABLE IF NOT EXISTS approval_decisions (
    approval_decision_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    artifact_id TEXT REFERENCES artifacts(artifact_id) ON DELETE SET NULL,
    work_order_id TEXT REFERENCES work_orders(work_order_id) ON DELETE SET NULL,
    decision_owner TEXT NOT NULL,
    decision_state TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    exact_side_effect TEXT NOT NULL,
    decision_notes TEXT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS outbound_actions (
    outbound_action_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    normalized_item_id TEXT REFERENCES normalized_items(normalized_item_id) ON DELETE SET NULL,
    artifact_id TEXT REFERENCES artifacts(artifact_id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_reference_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    payload_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    approval_decision_id TEXT REFERENCES approval_decisions(approval_decision_id) ON DELETE SET NULL,
    idempotency_key TEXT,
    stage_hash TEXT,
    execution_mode TEXT NOT NULL DEFAULT 'approval_required',
    status TEXT NOT NULL DEFAULT 'staged',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    approved_for_execution_at TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    last_error_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (execution_mode IN ('approval_required', 'stage_only', 'execute_after_approval')),
    CHECK (status IN ('staged', 'approved', 'executing', 'executed', 'failed', 'canceled'))
);

CREATE INDEX IF NOT EXISTS idx_outbound_actions_status
    ON outbound_actions (provider, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_outbound_actions_idempotency
    ON outbound_actions (provider, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS sync_receipts (
    sync_receipt_id TEXT PRIMARY KEY,
    outbound_action_id TEXT NOT NULL REFERENCES outbound_actions(outbound_action_id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    external_result_id TEXT,
    receipt_status TEXT NOT NULL,
    response_code TEXT,
    response_summary TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload_json JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    context_id TEXT REFERENCES client_contexts(context_id) ON DELETE SET NULL,
    artifact_id TEXT REFERENCES artifacts(artifact_id) ON DELETE SET NULL,
    approval_decision_id TEXT REFERENCES approval_decisions(approval_decision_id) ON DELETE SET NULL,
    outbound_action_id TEXT REFERENCES outbound_actions(outbound_action_id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    invoice_status TEXT NOT NULL DEFAULT 'draft',
    issued_at TIMESTAMPTZ,
    due_date DATE,
    total_amount_minor BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    terms_label TEXT,
    source_project_ref TEXT,
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, invoice_number),
    CHECK (invoice_status IN ('draft', 'pending_hitl', 'approved', 'sent', 'paid', 'overdue', 'disputed', 'void'))
);

CREATE INDEX IF NOT EXISTS idx_invoices_client_status
    ON invoices (client_id, invoice_status, due_date, created_at DESC);

CREATE TABLE IF NOT EXISTS payables (
    payable_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    context_id TEXT REFERENCES client_contexts(context_id) ON DELETE SET NULL,
    artifact_id TEXT REFERENCES artifacts(artifact_id) ON DELETE SET NULL,
    approval_decision_id TEXT REFERENCES approval_decisions(approval_decision_id) ON DELETE SET NULL,
    outbound_action_id TEXT REFERENCES outbound_actions(outbound_action_id) ON DELETE SET NULL,
    vendor_name TEXT NOT NULL,
    payable_status TEXT NOT NULL DEFAULT 'draft',
    due_date DATE,
    amount_minor BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    source_financial_transaction_id TEXT REFERENCES financial_transactions(financial_transaction_id) ON DELETE SET NULL,
    source_receipt_id TEXT REFERENCES receipts(receipt_id) ON DELETE SET NULL,
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (payable_status IN ('draft', 'pending_hitl', 'approved', 'scheduled', 'executed', 'failed', 'canceled'))
);

CREATE INDEX IF NOT EXISTS idx_payables_client_status
    ON payables (client_id, payable_status, due_date, created_at DESC);

CREATE TABLE IF NOT EXISTS reimbursements (
    reimbursement_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    context_id TEXT REFERENCES client_contexts(context_id) ON DELETE SET NULL,
    artifact_id TEXT REFERENCES artifacts(artifact_id) ON DELETE SET NULL,
    approval_decision_id TEXT REFERENCES approval_decisions(approval_decision_id) ON DELETE SET NULL,
    reimbursement_status TEXT NOT NULL DEFAULT 'draft',
    reimbursement_target TEXT NOT NULL,
    amount_minor BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    submitted_at TIMESTAMPTZ,
    expected_by DATE,
    settled_financial_transaction_id TEXT REFERENCES financial_transactions(financial_transaction_id) ON DELETE SET NULL,
    metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (reimbursement_status IN ('draft', 'pending_hitl', 'submitted', 'outstanding', 'paid', 'rejected'))
);

CREATE TABLE IF NOT EXISTS reconciliation_runs (
    reconciliation_run_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    context_id TEXT REFERENCES client_contexts(context_id) ON DELETE SET NULL,
    period_key TEXT NOT NULL,
    run_type TEXT NOT NULL,
    run_status TEXT NOT NULL DEFAULT 'open',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    summary_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, context_id, period_key, run_type),
    CHECK (run_type IN ('weekly', 'monthly_close', 'manual')),
    CHECK (run_status IN ('open', 'needs_review', 'resolved', 'locked'))
);

CREATE TABLE IF NOT EXISTS reconciliation_items (
    reconciliation_item_id TEXT PRIMARY KEY,
    reconciliation_run_id TEXT NOT NULL REFERENCES reconciliation_runs(reconciliation_run_id) ON DELETE CASCADE,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    source_id TEXT,
    exception_status TEXT NOT NULL DEFAULT 'open',
    severity TEXT NOT NULL DEFAULT 'medium',
    summary TEXT NOT NULL,
    details_json JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (item_type IN ('balance_mismatch', 'missing_receipt', 'uncategorized_transaction', 'unmatched_payment', 'other')),
    CHECK (exception_status IN ('open', 'acknowledged', 'resolved', 'ignored')),
    CHECK (severity IN ('low', 'medium', 'high'))
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_items_run_status
    ON reconciliation_items (reconciliation_run_id, exception_status, severity, created_at DESC);

CREATE TABLE IF NOT EXISTS accounting_period_locks (
    accounting_period_lock_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES client_accounts(client_id) ON DELETE CASCADE,
    context_id TEXT REFERENCES client_contexts(context_id) ON DELETE SET NULL,
    period_key TEXT NOT NULL,
    lock_status TEXT NOT NULL DEFAULT 'pending',
    reconciliation_run_id TEXT REFERENCES reconciliation_runs(reconciliation_run_id) ON DELETE SET NULL,
    approval_decision_id TEXT REFERENCES approval_decisions(approval_decision_id) ON DELETE SET NULL,
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, context_id, period_key),
    CHECK (lock_status IN ('pending', 'locked', 'reopened'))
);

INSERT INTO client_accounts (client_id, display_name, status, default_authority_mode)
VALUES ('marcus', 'Marcus', 'active', 'draft_only')
ON CONFLICT (client_id) DO NOTHING;

INSERT INTO client_profiles (
    client_id,
    legal_name,
    preferred_name,
    title,
    timezone,
    locale,
    onboarding_status,
    bio_json,
    profile_notes_json
)
VALUES (
    'marcus',
    'Marcus Bivines',
    'Marcus',
    'Founder',
    'America/New_York',
    'en-US',
    'partial',
    '{"status":"development_test_client"}'::JSONB,
    '["Use Marcus as the MVP development and test client before onboarding additional clients."]'::JSONB
)
ON CONFLICT (client_id) DO NOTHING;

INSERT INTO client_contexts (
    context_id,
    client_id,
    context_key,
    context_type,
    display_name,
    description,
    priority_order
)
VALUES
    ('ctx-marcus-personal', 'marcus', 'personal', 'personal', 'Personal', 'Marcus personal life context.', 10),
    ('ctx-marcus-bivinesgroup-llc', 'marcus', 'bivinesgroup_llc', 'business', 'BivinesGroup LLC', 'Marcus business operations context.', 20),
    ('ctx-marcus-hlg-firm', 'marcus', 'hlg_firm', 'business', 'HLG Firm', 'Marcus client and firm-facing context.', 30)
ON CONFLICT (context_id) DO NOTHING;

INSERT INTO context_accounts (
    context_account_id,
    client_id,
    context_id,
    provider,
    account_alias,
    connection_status,
    capabilities_json
)
VALUES
    ('conn-marcus-gmail', 'marcus', 'ctx-marcus-personal', 'gmail', 'marcus_primary', 'healthy', '{"ingest":true,"draft":true,"send":false}'::JSONB),
    ('conn-marcus-calendar', 'marcus', 'ctx-marcus-personal', 'google_calendar', 'marcus_primary', 'healthy', '{"ingest":true,"propose":true,"commit":false}'::JSONB),
    ('conn-marcus-whatsapp', 'marcus', 'ctx-marcus-personal', 'whatsapp', 'marcus_phone', 'syncing', '{"ingest":true,"reply":false}'::JSONB),
    ('conn-marcus-social', 'marcus', 'ctx-marcus-hlg-firm', 'social_dm', 'marcus_social', 'review_mode', '{"ingest":true,"reply":false}'::JSONB)
ON CONFLICT (context_account_id) DO NOTHING;

import type { Metadata } from "next";
import { PageHeader } from "../components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Config editor — FlavorOS Admin",
};

const CONFIG_SECTIONS = [
  {
    label: "Tenant defaults",
    items: [
      { key: "default_plan", value: "pro", editable: true },
      { key: "max_agents_per_tenant", value: "10", editable: true },
      { key: "max_users_per_tenant", value: "25", editable: true },
    ],
  },
  {
    label: "Agent runtime",
    items: [
      { key: "orchestrator_mode", value: "single-pass", editable: false },
      { key: "llm_provider", value: "openrouter", editable: true },
      { key: "default_model", value: "claude-4-sonnet", editable: true },
      { key: "max_tool_retries", value: "3", editable: true },
    ],
  },
  {
    label: "Integrations",
    items: [
      { key: "composio_enabled", value: "false", editable: false },
      { key: "gbrain_mode", value: "local-stdio", editable: false },
      { key: "voice_enabled", value: "false", editable: false },
    ],
  },
  {
    label: "Security",
    items: [
      { key: "require_x_client_id", value: "true", editable: false },
      { key: "hitl_enforcement", value: "strict", editable: false },
      { key: "audit_log_retention_days", value: "90", editable: true },
    ],
  },
];

export default function ConfigPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Config editor"
        description="Operational knobs and feature flags. Read-only items require code changes."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {CONFIG_SECTIONS.map((section) => (
          <div
            key={section.label}
            className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
              <h2 className="text-sm font-semibold">{section.label}</h2>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {section.items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="text-xs font-mono text-neutral-600 dark:text-neutral-400 truncate">
                      {item.key}
                    </code>
                    {!item.editable && (
                      <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-400 dark:bg-neutral-800">
                        read-only
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-sm font-mono tabular-nums ${
                      item.editable
                        ? "text-neutral-800 dark:text-neutral-200"
                        : "text-neutral-400 dark:text-neutral-500"
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-400 dark:text-neutral-500">
        Config persistence wires up once the API config endpoint ships. Currently display-only.
      </p>
    </div>
  );
}

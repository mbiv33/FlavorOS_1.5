import { Card } from "@/components/primitives/Card";
import { MOCK_PREFERENCE_GROUPS } from "@/lib/mock/preferences";

/**
 * Preferences grouped by life-domain (Travel / Work / Wellness / General).
 * PRD 04 §4.7. Defaults are shared across contexts; explicit scoping is
 * the rare case.
 */
export default function PreferencesPage() {
  return (
    <div>
      <div className="px-1 pt-4 pb-3.5">
        <h1 className="m-0 mb-1 text-[28px] font-bold tracking-tight">
          Preferences
        </h1>
        <div className="text-[13.5px] text-ink-2">
          Grouped by life-domain. Preferences apply everywhere unless scoped.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {MOCK_PREFERENCE_GROUPS.map((group) => (
          <Card key={group.domain} className="p-5">
            <header className="mb-3.5">
              <h2 className="m-0 text-[16px] font-bold tracking-tight">
                {group.label}
              </h2>
              {group.description ? (
                <div className="text-[12.5px] text-ink-3 mt-0.5">
                  {group.description}
                </div>
              ) : null}
            </header>
            <ul className="list-none p-0 m-0">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="grid items-baseline gap-3 py-2.5 border-b border-line text-[13.5px] last:border-b-0"
                  style={{ gridTemplateColumns: "150px 1fr" }}
                >
                  <span className="text-ink-3 font-semibold">{item.label}</span>
                  <span className="text-ink-2">
                    {item.value}
                    {item.scope ? (
                      <span className="ml-2 text-[11.5px] text-accent">
                        scoped: {item.scope}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

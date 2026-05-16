import type { ArtifactPreview as ArtifactPreviewT } from "@/lib/types/approval";

/**
 * Inline artifact preview. Render adapts by artifact type.
 * Used inside the expanded card body — no container of its own.
 */
export function ArtifactPreview({ preview }: { preview: ArtifactPreviewT }) {
  if (preview.rows && preview.rows.length > 0) {
    return (
      <div
        className="my-3 px-3.5 py-3 rounded-sm2 text-[13px] text-ink-2"
        style={{
          background: "rgba(91,70,214,0.04)",
          border: "1px dashed rgba(91,70,214,0.18)",
        }}
      >
        {preview.rows.map((row) => (
          <div key={row.label} className="flex justify-between py-px">
            <span className="text-ink-3">{row.label}</span>
            <span>{row.value}</span>
          </div>
        ))}
      </div>
    );
  }
  if (preview.body) {
    return (
      <div
        className="my-3 px-3.5 py-3 rounded-sm2 text-[13px] text-ink-2 whitespace-pre-wrap"
        style={{
          background: "rgba(91,70,214,0.04)",
          border: "1px dashed rgba(91,70,214,0.18)",
        }}
      >
        {preview.body}
      </div>
    );
  }
  return null;
}

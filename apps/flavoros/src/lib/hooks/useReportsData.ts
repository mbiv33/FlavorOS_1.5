"use client";

import type { CardStatus } from "@/lib/fixtures";
import {
  REPORTS_PILE_META,
  REPORTS_PILE_ORDER,
  REPORTS_STAT_LABELS,
} from "@/lib/reports-config";
import {
  buildChannelStats,
  buildPileDefs,
  relativeTime,
} from "@/lib/mappers";
import type { ArtifactRead } from "@/lib/api";
import { useChannelData } from "@/lib/hooks/useChannelData";

export type ReportTableRow = {
  id: string;
  title: string;
  artifactType: string;
  context: string;
  agent: string;
  status: CardStatus;
  updated: string;
  sourceLinkLabel?: string;
};

function artifactStatus(artifact: ArtifactRead): CardStatus {
  if (artifact.status === "approved") return "Completed";
  if (artifact.status === "ready") return "Needs review";
  if (artifact.status === "draft") return "Draft ready";
  return "Completed";
}

function artifactToReportRow(artifact: ArtifactRead): ReportTableRow {
  return {
    id: artifact.id,
    title: artifact.title,
    artifactType: artifact.kind,
    context: artifact.meta?.source ? String(artifact.meta.source) : "Sync",
    agent: "Khadijah",
    status: artifactStatus(artifact),
    updated: relativeTime(artifact.updated_at),
  };
}

export function useReportsData() {
  const { artifacts, approvals, inboxItems, loading, error } = useChannelData();
  const piles = buildPileDefs(inboxItems, REPORTS_PILE_ORDER, REPORTS_PILE_META);
  const stats = buildChannelStats(artifacts, approvals, REPORTS_STAT_LABELS);
  const tableRows = artifacts.map(artifactToReportRow);

  return { piles, stats, tableRows, loading, error };
}

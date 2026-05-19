"use client";

import type { CardStatus } from "@/lib/fixtures";
import {
  PROJECTS_PILE_META,
  PROJECTS_PILE_ORDER,
  PROJECTS_STAT_LABELS,
} from "@/lib/projects-config";
import {
  buildChannelStats,
  buildPileDefs,
  relativeTime,
} from "@/lib/mappers";
import type { ArtifactRead } from "@/lib/api";
import { useChannelData } from "@/lib/hooks/useChannelData";

export type ProjectTableRow = {
  id: string;
  title: string;
  owner: string;
  context: string;
  nextStep: string;
  status: CardStatus;
  dueAt: string;
  sourceLinkLabel?: string;
};

function artifactStatus(artifact: ArtifactRead): CardStatus {
  if (artifact.status === "approved") return "Completed";
  if (artifact.status === "ready") return "Needs review";
  if (artifact.status === "draft") return "Draft ready";
  return "Completed";
}

function artifactToProjectRow(artifact: ArtifactRead): ProjectTableRow {
  return {
    id: artifact.id,
    title: artifact.title,
    owner: "Khadijah",
    context: artifact.kind,
    nextStep: artifact.body?.slice(0, 80) ?? "—",
    status: artifactStatus(artifact),
    dueAt: relativeTime(artifact.updated_at),
  };
}

export function useProjectsData() {
  const { artifacts, approvals, inboxItems, loading, error } = useChannelData();
  const piles = buildPileDefs(inboxItems, PROJECTS_PILE_ORDER, PROJECTS_PILE_META);
  const stats = buildChannelStats(artifacts, approvals, PROJECTS_STAT_LABELS);
  const tableRows = artifacts.map(artifactToProjectRow);

  return { piles, stats, tableRows, loading, error };
}

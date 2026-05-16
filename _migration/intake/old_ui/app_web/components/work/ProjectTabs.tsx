"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { StatusTab } from "./tabs/StatusTab";
import { BriefTab } from "./tabs/BriefTab";
import { DecisionsTab } from "./tabs/DecisionsTab";
import { FilesTab } from "./tabs/FilesTab";
import type { Project } from "@/lib/types/project";

const TAB_CLS =
  "px-3.5 py-2.5 text-[13.5px] font-semibold text-ink-3 cursor-pointer border-b-2 border-transparent -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 data-[state=active]:text-ink data-[state=active]:border-ink";

export function ProjectTabs({ project }: { project: Project }) {
  return (
    <Tabs.Root defaultValue="status">
      <Tabs.List
        className="flex gap-0.5 border-b border-line mb-4"
        aria-label="Project sections"
      >
        <Tabs.Trigger value="status" className={TAB_CLS}>Status</Tabs.Trigger>
        <Tabs.Trigger value="brief" className={TAB_CLS}>Brief</Tabs.Trigger>
        <Tabs.Trigger value="decisions" className={TAB_CLS}>Decisions</Tabs.Trigger>
        <Tabs.Trigger value="files" className={TAB_CLS}>
          Files{project.files.length ? ` (${project.files.length})` : ""}
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="status" className="focus-visible:outline-none">
        <StatusTab project={project} />
      </Tabs.Content>
      <Tabs.Content value="brief" className="focus-visible:outline-none">
        <BriefTab project={project} />
      </Tabs.Content>
      <Tabs.Content value="decisions" className="focus-visible:outline-none">
        <DecisionsTab project={project} />
      </Tabs.Content>
      <Tabs.Content value="files" className="focus-visible:outline-none">
        <FilesTab project={project} />
      </Tabs.Content>
    </Tabs.Root>
  );
}

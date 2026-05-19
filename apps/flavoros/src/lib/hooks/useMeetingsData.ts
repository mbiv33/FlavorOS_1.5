"use client";

import {
  MEETING_DEFINITIONS,
  MEETING_TOPICS,
  type MeetingTopic,
} from "@/lib/meetings-config";
import { useChannelData } from "@/lib/hooks/useChannelData";

export type MeetingCard = {
  topic: MeetingTopic;
  href: string;
  title: string;
  description: string;
  count: number;
};

export function useMeetingsData() {
  const { inboxItems, loading, error } = useChannelData();

  const meetingCards: MeetingCard[] = MEETING_TOPICS.map((topic) => {
    const def = MEETING_DEFINITIONS[topic];
    return {
      topic,
      href: `/meetings/${topic}`,
      title: def.title,
      description: def.preparedSummary,
      count: inboxItems.length,
    };
  });

  return { meetingCards, inboxItems, loading, error };
}

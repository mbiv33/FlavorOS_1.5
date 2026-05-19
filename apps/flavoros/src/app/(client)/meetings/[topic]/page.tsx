import { notFound } from "next/navigation";

import { MeetingTopicView } from "@/components/MeetingTopicView";
import { isMeetingTopic } from "@/lib/meetings-config";

export default async function MeetingScreen({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  if (!isMeetingTopic(topic)) notFound();
  return <MeetingTopicView topic={topic} />;
}

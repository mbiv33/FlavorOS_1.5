import type { Approval } from "@/lib/types/approval";

/*
 * Mock approvals. Mirrors the shape an agent would emit when an artifact is
 * ready for the client. Ordered by createdAt desc when consumed.
 *
 * To swap to real data: replace this file with a fetch and matching shape.
 */

export const MOCK_APPROVALS: Approval[] = [
  {
    id: "appr-247",
    state: "pending",
    persona: "maxine",
    verb: "drafted invoice",
    object: "#247 to Acme",
    contextId: "llc-flourished",
    stakes: {
      money: "$4,200",
      timeSensitive: "Net 30",
      publicFacing: true,
    },
    preview: {
      type: "invoice",
      rows: [
        { label: "To", value: "Acme Co. — A. Patel" },
        { label: "Project", value: "Q1 strategy advisory" },
        { label: "Hours billed", value: "21 @ $200" },
        { label: "Terms", value: "Net 30 · ACH preferred" },
      ],
    },
    reasoning:
      "21 hours logged across 6 sessions, billed at the SOW's $200/hr advisory rate.",
    ripple: {
      text:
        "Approving today brings FlourishED May AR to $11,800 open. Acme's prior invoice cleared in 18 days.",
    },
    postApproveText: "Approved — sending tomorrow 9 AM",
    voicePhrase: "Approve the Acme invoice",
    createdAt: "2026-05-08T06:42:00Z",
  },
  {
    id: "appr-johnsmith",
    state: "pending",
    persona: "sinclair",
    verb: "drafted reply",
    object: "to John Smith (NTC board)",
    contextId: "w2-ntc",
    stakes: {
      timeSensitive: "today",
      publicFacing: "to board member",
    },
    preview: {
      type: "email",
      inboundSummary:
        "John asked if you can present the literacy initiative at the June board meeting.",
      body:
        "Hi John — yes, I can take that slot. I'll plan ~15 minutes with Q&A. Sending a draft outline by next Tuesday so you can route it to the chair. — Client",
    },
    reasoning:
      "Matches your standard board-reply tone. June 12 conflicts with no calendar holds; 15-minute slot is within your usual presentation length.",
    doMyselfLabel: "I'll edit & send",
    postApproveText: "Approved — sending in next batch (4:00 PM)",
    voicePhrase: "Approve John's reply",
    createdAt: "2026-05-08T07:14:00Z",
  },
  {
    id: "appr-acme-intro",
    state: "pending",
    persona: "kyle",
    verb: "drafted follow-up",
    object: "to Acme intro request",
    contextId: "llc-flourished",
    stakes: {
      publicFacing: "warm intro",
    },
    preview: {
      type: "follow-up",
      inboundSummary:
        "Tara from Acme asked if you'd intro her to Dr. M. Williams at NSU. Drafted a 3-line note + your standard intro-consent ping to Williams first.",
    },
    doMyselfLabel: "I'll handle it",
    postApproveText: "Approved — consent ping sending in next batch (4:00 PM)",
    voicePhrase: "Approve the Acme intro",
    createdAt: "2026-05-08T07:38:00Z",
  },
];

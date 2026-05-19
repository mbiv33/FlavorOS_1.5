import { FlavorOSSession, listProviderConnections } from "./api";

export async function isClientReadyForCommandCenter(
  session: FlavorOSSession,
): Promise<boolean> {
  try {
    const connections = await listProviderConnections(session);
    return connections.some((c) => c.status === "ready");
  } catch {
    return false;
  }
}

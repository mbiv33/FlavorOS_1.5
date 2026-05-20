import {
  FlavorOSSession,
  getUniverseReadiness,
  listProviderConnections,
} from "./api";

export async function isClientReadyForCommandCenter(
  session: FlavorOSSession,
): Promise<boolean> {
  try {
    const readiness = await getUniverseReadiness(session);
    if (readiness.sync_ready) {
      return true;
    }
    const connections = await listProviderConnections(session);
    return connections.some((c) => c.status === "ready");
  } catch {
    return false;
  }
}

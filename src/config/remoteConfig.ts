export type RemoteConfig = {
  paywallEnabled: boolean;
};

export async function getRemoteConfig(): Promise<RemoteConfig> {
  // Stub: fetch from remote config service later
  return { paywallEnabled: false };
}



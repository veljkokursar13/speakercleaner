export type Entitlements = {
  pro: boolean;
};

export async function getEntitlements(): Promise<Entitlements> {
  // Stub: query SDK/backend later
  return { pro: false };
}



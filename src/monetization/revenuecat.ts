export type Package = {
  identifier: string;
  price: string; // display string
};

export async function getPackages(): Promise<Package[]> {
  // Stub: fetch packages from backend/RevenueCat later
  return [];
}

export async function purchase(identifier: string): Promise<{ success: boolean }> {
  // Stub: perform purchase
  return { success: false };
}



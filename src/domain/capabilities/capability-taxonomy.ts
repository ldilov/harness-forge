export interface CapabilityTaxonomyEntry {
  id: string;
  family: string;
  displayName: string;
  description: string;
}

export interface CapabilityTaxonomyDocument {
  version: number;
  capabilities: CapabilityTaxonomyEntry[];
}

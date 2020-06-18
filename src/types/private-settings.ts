export interface MappingEntry {
  hull: string | undefined;
  service: string | undefined;
}

export interface PrivateSettings {
  domain?: string;
  api_key?: string;
  contact_synchronized_segments: string[];
  contact_lookup_attribute_email?: string;
  contact_lookup_attribute_unique_external_id?: string;
  contact_attributes_outbound: MappingEntry[];
  contact_attributes_inbound: MappingEntry[];
  account_synchronized_segments: string[];
  account_lookup_attribute_domain?: string;
  account_attributes_outbound: MappingEntry[];
  account_attributes_inbound: MappingEntry[];
  account_filter_inbound_require_domain: boolean;
}

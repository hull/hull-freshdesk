export const STATUS_SETUPREQUIRED_NOAPIKEY =
  "Connector unauthenticated: No API Key is present.";

export const STATUS_SETUPREQUIRED_NODOMAIN =
  "Connector unauthenticated: No domain is present.";

export const STATUS_SETUPREQUIRED_NOLOOKUPACCTDOMAIN =
  "Connector not fully configured: Domain Lookup to synchronize Accounts to Freshdesk is not specified.";

export const STATUS_SETUPREQUIRED_NOLOOKUPCONTACTEMAIL =
  "Connector not fully configured: Email Lookup to synchronize Users to Freshdesk is not specified.";

export const STATUS_WARN_FIELDDOESNTEXIST = (
  fieldName: string,
  settingName: string,
): string => {
  return `Invalid field: The Freshdesk field '${fieldName}' referenced in Setting '${settingName}' does not or no longer exist and will be ignored. Please remove or modify the corresponding mapping.`;
};

export const STATUS_ERROR_AUTHN = (errorDetails: string): string =>
  `Connector unauthenticated: Freshdesk API returned status code 401 for currently authenticated agent, please check the credentials of the connector: ${errorDetails}`;

export const VALIDATION_SKIP_ACCOUNT_NODOMAINLOOKUP =
  "No domain lookup attribute specified. Cannot synchronize company.";
export const VALIDATION_SKIP_ACCOUNT_NONAMEMAPPING =
  "No name mapped, but name is mandatory in Freshdesk. Cannot synchronize company.";
export const VALIDATION_SKIP_HULLOBJECT_NOTINANYSEGMENT = (
  objectType: "user" | "account",
) => {
  return `Hull ${objectType} won't be synchronized since it is not matching any of the filtered segments.`;
};

export const VALIDATION_WARN_ACCOUNT_INVALIDMAPPINGOUT = (
  fieldName: string,
): string => {
  return `Invalid mapping to company field '${fieldName}' has been ignored.`;
};

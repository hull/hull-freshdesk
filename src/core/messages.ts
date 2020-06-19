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

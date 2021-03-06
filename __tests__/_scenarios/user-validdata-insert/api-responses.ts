import nock from "nock";
import { Url } from "url";
import { API_DOMAIN, API_KEY } from "../../_helpers/constants";
import ApiResponseListAllContactFields from "../../_data/api__list_all_contact_fields.json";
import ApiResponseListAllCompanyFields from "../../_data/api__list_all_company_fields.json";
import ApiResponseCreateContact from "../../_data/api__create_contact.json";

const setupApiMockResponses = (
  nockFn: (
    basePath: string | RegExp | Url,
    options?: nock.Options | undefined,
  ) => nock.Scope,
): void => {
  nockFn(`https://${API_DOMAIN}.freshdesk.com`)
    .get("/api/v2/contact_fields")
    .matchHeader(
      "authorization",
      `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
    )
    .reply(200, ApiResponseListAllContactFields, {
      "Content-Type": "application/json",
    });

  nockFn(`https://${API_DOMAIN}.freshdesk.com`)
    .get("/api/v2/company_fields")
    .matchHeader(
      "authorization",
      `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
    )
    .reply(200, ApiResponseListAllCompanyFields, {
      "Content-Type": "application/json",
    });

  nockFn(`https://${API_DOMAIN}.freshdesk.com`)
    .get(
      `/api/v2/search/contacts?query="email:'${ApiResponseCreateContact.email}'"`,
    )
    .matchHeader(
      "authorization",
      `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
    )
    .reply(
      200,
      { total: 0, results: [] },
      {
        "Content-Type": "application/json",
      },
    );

  nockFn(`https://${API_DOMAIN}.freshdesk.com`)
    .post("/api/v2/contacts")
    .matchHeader(
      "authorization",
      `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
    )
    .reply(200, ApiResponseCreateContact, {
      "Content-Type": "application/json",
    });
};

// eslint-disable-next-line import/no-default-export
export default setupApiMockResponses;

import nock from "nock";
import { Url } from "url";
import {
  API_DOMAIN,
  API_KEY,
  API_UPDATEDSINCE,
} from "../../_helpers/constants";
import ApiResponseListAllContactFields from "../../_data/api__list_all_contact_fields.json";
import ApiResponseListAllCompanyFields from "../../_data/api__list_all_company_fields.json";
import ApiResponseListAllCompanies from "../../_data/api__list_all_companies.json";
import { cloneDeep } from "lodash";
import { DateTime } from "luxon";

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

  const companies = cloneDeep(ApiResponseListAllCompanies);
  companies[0].updated_at = DateTime.fromISO(API_UPDATEDSINCE)
    .plus({ minutes: 2 })
    .toISO();
  companies[1].updated_at = DateTime.fromISO(API_UPDATEDSINCE)
    .minus({ hours: 2 })
    .toISO();

  nockFn(`https://${API_DOMAIN}.freshdesk.com`)
    .get(`/api/v2/companies?page=1&per_page=100`)
    .matchHeader(
      "authorization",
      `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
    )
    .reply(200, companies, {
      "Content-Type": "application/json",
    });
};

// eslint-disable-next-line import/no-default-export
export default setupApiMockResponses;

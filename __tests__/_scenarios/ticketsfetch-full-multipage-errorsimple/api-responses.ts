import nock from "nock";
import { Url } from "url";
import { API_DOMAIN, API_KEY } from "../../_helpers/constants";
import ApiResponseListAllContactFields from "../../_data/api__list_all_contact_fields.json";
import ApiResponseListAllCompanyFields from "../../_data/api__list_all_company_fields.json";
import ApiResponseListAllTickets from "../../_data/api__list_all_tickets.json";

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
      `/api/v2/tickets?page=1&per_page=100&order_by=updated_at&order_type=desc&include=description,requester,stats`,
    )
    .matchHeader(
      "authorization",
      `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
    )
    .reply(200, ApiResponseListAllTickets, {
      "Content-Type": "application/json",
      link: `<https://${API_DOMAIN}.freshdesk.com/api/v2/tickets?page=2&per_page=100&order_by=updated_at&order_type=desc&include=description,requester,stats>;rel="next`,
    });

  nockFn(`https://${API_DOMAIN}.freshdesk.com`)
    .get(
      `/api/v2/tickets?page=2&per_page=100&order_by=updated_at&order_type=desc&include=description,requester,stats`,
    )
    .matchHeader(
      "authorization",
      `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
    )
    .replyWithError("Something went wrong");
};

// eslint-disable-next-line import/no-default-export
export default setupApiMockResponses;

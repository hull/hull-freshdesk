import { ServiceClient } from "../../src/core/service-client";
import nock from "nock";
import ApiResponseListAllContactFields from "../_data/api__list_all_contact_fields.json";
import {
  ApiResultObject,
  FreshdeskPagedResult,
  FreshdeskTicket,
} from "../../src/core/service-objects";
import {
  FreshdeskContactField,
  FreshdeskCompanyField,
  FreshdeskContactCreateUpdate,
  FreshdeskContact,
  FreshdeskFilterResult,
  FreshdeskCompanyCreateOrUpdate,
  FreshdeskCompany,
  FreshdeskAgent,
} from "../../src/core/service-objects";
import {
  API_BASE_URL,
  API_KEY,
  API_DOMAIN,
  API_UPDATEDSINCE,
} from "../_helpers/constants";
import ApiResponseListAllCompanyFields from "../_data/api__list_all_company_fields.json";
import ApiResponseCreateContact from "../_data/api__create_contact.json";
import ApiResponseUpdateContact from "../_data/api__update_contact.json";
import ApiResponseFilterContacts from "../_data/api__filter_contacts.json";
import ApiResponseCreateCompany from "../_data/api__create_company.json";
import ApiResponseUpdateCompany from "../_data/api__update_company.json";
import ApiResponseFilterCompanies from "../_data/api__filter_companies.json";
import ApiResponseCurrentlyAuthenticatedAgent from "../_data/api_me.json";
import ApiResponseListAllContacts from "../_data/api__list_all_contacts.json";
import ApiResponseListAllCompanies from "../_data/api__list_all_companies.json";
import ApiResponseListAllTickets from "../_data/api__list_all_tickets.json";

describe("ServiceClient", () => {
  beforeEach(() => {
    nock.cleanAll();
    nock.restore();

    if (!nock.isActive()) {
      nock.activate();
    }
  });

  afterEach(() => {
    nock.cleanAll();
    nock.restore();
  });

  describe("constructor()", () => {
    it("should initialize the API Key and domain", () => {
      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      expect(client.apiKey).toEqual(API_KEY);
      expect(client.apiBaseUrl).toEqual(`https://${API_DOMAIN}.freshdesk.com`);
    });
  });

  describe("listContactFields()", () => {
    it("should list all contact fields on success", async () => {
      nock(API_BASE_URL)
        .get("/api/v2/contact_fields")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllContactFields, {
          "Content-Type": "application/json",
        });

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listContactFields();
      const expected: ApiResultObject<
        unknown,
        FreshdeskContactField[] | undefined
      > = {
        data: ApiResponseListAllContactFields,
        endpoint: `${API_BASE_URL}/api/v2/contact_fields`,
        method: "query",
        record: undefined,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should return an error result and not throw if API responds with status 500", async () => {
      console.log;
      nock(API_BASE_URL)
        .get("/api/v2/contact_fields")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .replyWithError("Some arbitrary error");

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listContactFields();
      const expected: ApiResultObject<
        unknown,
        FreshdeskContactField[] | undefined
      > = {
        data: undefined,
        endpoint: `${API_BASE_URL}/api/v2/contact_fields`,
        method: "query",
        record: undefined,
        success: false,
        error: ["Some arbitrary error"],
      };

      expect(actual).toEqual(expected);
    });
  });

  describe("listCompanyFields()", () => {
    it("should list all company fields on success", async () => {
      nock(API_BASE_URL)
        .get("/api/v2/company_fields")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllCompanyFields, {
          "Content-Type": "application/json",
        });

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listCompanyFields();
      const expected: ApiResultObject<
        unknown,
        FreshdeskCompanyField[] | undefined
      > = {
        data: ApiResponseListAllCompanyFields,
        endpoint: `${API_BASE_URL}/api/v2/company_fields`,
        method: "query",
        record: undefined,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should return an error result and not throw if API responds with status 500", async () => {
      nock(API_BASE_URL)
        .get("/api/v2/company_fields")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .replyWithError("Some arbitrary error");

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listCompanyFields();
      const expected: ApiResultObject<
        unknown,
        FreshdeskCompanyField[] | undefined
      > = {
        data: undefined,
        endpoint: `${API_BASE_URL}/api/v2/company_fields`,
        method: "query",
        record: undefined,
        success: false,
        error: ["Some arbitrary error"],
      };

      expect(actual).toEqual(expected);
    });
  });

  describe("createContact()", () => {
    it("should create a contact on success", async () => {
      nock(API_BASE_URL)
        .post("/api/v2/contacts")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseCreateContact, {
          "Content-Type": "application/json",
        });

      const payload = {
        name: "Super Man",
        email: "superman@freshdesk.com",
        other_emails: ["lex@freshdesk.com", "louis@freshdesk.com"],
      };

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.createContact(payload);
      const expected: ApiResultObject<
        FreshdeskContactCreateUpdate,
        FreshdeskContact | undefined
      > = {
        data: ApiResponseCreateContact,
        endpoint: `${API_BASE_URL}/api/v2/contacts`,
        method: "insert",
        record: payload,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should return an error result and not throw if API responds with status 500", async () => {
      nock(API_BASE_URL)
        .post("/api/v2/contacts")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .replyWithError("Some arbitrary error");

      const payload = {
        name: "Super Man",
        email: "superman@freshdesk.com",
        other_emails: ["lex@freshdesk.com", "louis@freshdesk.com"],
      };

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.createContact(payload);
      const expected: ApiResultObject<
        FreshdeskContactCreateUpdate,
        FreshdeskContact | undefined
      > = {
        data: undefined,
        endpoint: `${API_BASE_URL}/api/v2/contacts`,
        method: "insert",
        record: payload,
        success: false,
        error: ["Some arbitrary error"],
      };

      expect(actual).toEqual(expected);
    });
  });

  describe("updateContact()", () => {
    it("should update a contact on success", async () => {
      nock(API_BASE_URL)
        .put("/api/v2/contacts/432")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseUpdateContact, {
          "Content-Type": "application/json",
        });

      const payload = {
        name: "Clark Kent",
        job_title: "Journalist",
        other_emails: ["louis@freshdesk.com", "jonathan.kent@freshdesk.com"],
      };

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.updateContact(432, payload);
      const expected: ApiResultObject<
        FreshdeskContactCreateUpdate,
        FreshdeskContact | undefined
      > = {
        data: ApiResponseUpdateContact,
        endpoint: `${API_BASE_URL}/api/v2/contacts/432`,
        method: "update",
        record: payload,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should return an error result and not throw if API responds with status 500", async () => {
      nock(API_BASE_URL)
        .put("/api/v2/contacts/432")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .replyWithError("Some arbitrary error");

      const payload = {
        name: "Clark Kent",
        job_title: "Journalist",
        other_emails: ["louis@freshdesk.com", "jonathan.kent@freshdesk.com"],
      };

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.updateContact(432, payload);
      const expected: ApiResultObject<
        FreshdeskContactCreateUpdate,
        FreshdeskContact | undefined
      > = {
        data: undefined,
        endpoint: `${API_BASE_URL}/api/v2/contacts/432`,
        method: "update",
        record: payload,
        success: false,
        error: ["Some arbitrary error"],
      };

      expect(actual).toEqual(expected);
    });
  });

  describe("filterContacts()", () => {
    it("should list all contacts on success", async () => {
      nock(API_BASE_URL)
        .get(`/api/v2/search/contacts?query="active:true"`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseFilterContacts, {
          "Content-Type": "application/json",
        });

      const q = "active:true";
      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.filterContacts(q);
      const expected: ApiResultObject<
        unknown,
        FreshdeskFilterResult<FreshdeskContact> | undefined
      > = {
        data: ApiResponseFilterContacts,
        endpoint: `${API_BASE_URL}/api/v2/search/contacts?query="active:true"`,
        method: "query",
        record: undefined,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should return an error result and not throw if API responds with status 500", async () => {
      nock(API_BASE_URL)
        .get(`/api/v2/search/contacts?query="active:true"`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .replyWithError("Some arbitrary error");

      const q = "active:true";
      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.filterContacts(q);
      const expected: ApiResultObject<
        unknown,
        FreshdeskFilterResult<FreshdeskContact> | undefined
      > = {
        data: undefined,
        endpoint: `${API_BASE_URL}/api/v2/search/contacts?query="active:true"`,
        method: "query",
        record: undefined,
        success: false,
        error: ["Some arbitrary error"],
      };

      expect(actual).toEqual(expected);
    });
  });

  describe("createCompany()", () => {
    it("should create a company on success", async () => {
      nock(API_BASE_URL)
        .post("/api/v2/companies")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseCreateCompany, {
          "Content-Type": "application/json",
        });

      const payload = {
        name: "SuperNova",
        domains: ["supernova", "nova"],
        description: "Spaceship Manufacturing Company",
        health_score: "Happy",
        account_tier: "Premium",
        renewal_date: "2020-12-31",
      };

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.createCompany(payload);
      const expected: ApiResultObject<
        FreshdeskCompanyCreateOrUpdate,
        FreshdeskCompany | undefined
      > = {
        data: ApiResponseCreateCompany,
        endpoint: `${API_BASE_URL}/api/v2/companies`,
        method: "insert",
        record: payload,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should return an error result and not throw if API responds with status 500", async () => {
      nock(API_BASE_URL)
        .post("/api/v2/companies")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .replyWithError("Some arbitrary error");

      const payload = {
        name: "SuperNova",
        domains: ["supernova", "nova"],
        description: "Spaceship Manufacturing Company",
        health_score: "Happy",
        account_tier: "Premium",
        renewal_date: "2020-12-31",
      };

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.createCompany(payload);
      const expected: ApiResultObject<
        FreshdeskCompanyCreateOrUpdate,
        FreshdeskCompany | undefined
      > = {
        data: undefined,
        endpoint: `${API_BASE_URL}/api/v2/companies`,
        method: "insert",
        record: payload,
        success: false,
        error: ["Some arbitrary error"],
      };

      expect(actual).toEqual(expected);
    });
  });

  describe("updateCompany()", () => {
    it("should update a company on success", async () => {
      nock(API_BASE_URL)
        .put("/api/v2/companies/8")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseUpdateCompany, {
          "Content-Type": "application/json",
        });

      const payload = {
        name: "Super Nova",
        domains: ["supernova", "nova", "super"],
        description: "Space Shuttle Manufacturing",
        account_tier: "Enterprise",
        industry: "Aerospace and Defense",
      };

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.updateCompany(8, payload);
      const expected: ApiResultObject<
        FreshdeskCompanyCreateOrUpdate,
        FreshdeskCompany | undefined
      > = {
        data: ApiResponseUpdateCompany,
        endpoint: `${API_BASE_URL}/api/v2/companies/8`,
        method: "update",
        record: payload,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should return an error result and not throw if API responds with status 500", async () => {
      nock(API_BASE_URL)
        .put("/api/v2/companies/8")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .replyWithError("Some arbitrary error");

      const payload = {
        name: "Super Nova",
        domains: ["supernova", "nova", "super"],
        description: "Space Shuttle Manufacturing",
        account_tier: "Enterprise",
        industry: "Aerospace and Defense",
      };

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.updateCompany(8, payload);
      const expected: ApiResultObject<
        FreshdeskCompanyCreateOrUpdate,
        FreshdeskCompany | undefined
      > = {
        data: undefined,
        endpoint: `${API_BASE_URL}/api/v2/companies/8`,
        method: "update",
        record: payload,
        success: false,
        error: ["Some arbitrary error"],
      };

      expect(actual).toEqual(expected);
    });
  });

  describe("filterCompanies()", () => {
    it("should list all companies on success", async () => {
      nock(API_BASE_URL)
        .get(`/api/v2/search/companies?query="domain:'lexcorp.org'"`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseFilterCompanies, {
          "Content-Type": "application/json",
        });

      const q = "domain:'lexcorp.org'";
      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.filterCompanies(q);
      const expected: ApiResultObject<
        unknown,
        FreshdeskFilterResult<FreshdeskCompany> | undefined
      > = {
        data: ApiResponseFilterCompanies,
        endpoint: `${API_BASE_URL}/api/v2/search/companies?query="domain:'lexcorp.org'"`,
        method: "query",
        record: undefined,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should return an error result and not throw if API responds with status 500", async () => {
      nock(API_BASE_URL)
        .get(`/api/v2/search/companies?query="domain:'lexcorp.org'"`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .replyWithError("Some arbitrary error");

      const q = "domain:'lexcorp.org'";
      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.filterCompanies(q);
      const expected: ApiResultObject<
        unknown,
        FreshdeskFilterResult<FreshdeskCompany> | undefined
      > = {
        data: undefined,
        endpoint: `${API_BASE_URL}/api/v2/search/companies?query="domain:'lexcorp.org'"`,
        method: "query",
        record: undefined,
        success: false,
        error: ["Some arbitrary error"],
      };

      expect(actual).toEqual(expected);
    });
  });

  describe("getCurrentlyAuthenticatedAgent()", () => {
    it("should return the currently authenticated agent on success", async () => {
      nock(API_BASE_URL)
        .get(`/api/v2/agents/me`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseCurrentlyAuthenticatedAgent, {
          "Content-Type": "application/json",
        });

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.getCurrentlyAuthenticatedAgent();
      const expected: ApiResultObject<unknown, FreshdeskAgent | undefined> = {
        data: ApiResponseCurrentlyAuthenticatedAgent,
        endpoint: `${API_BASE_URL}/api/v2/agents/me`,
        method: "query",
        record: undefined,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should return an error result and not throw if API responds with status 401", async () => {
      const errorData = {
        description: "Authentication Failure",
        errors: [
          {
            code: "invalid_credentials",
            message: "Incorrect or missing API credentials.",
          },
        ],
      };
      nock(API_BASE_URL)
        .get(`/api/v2/agents/me`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(401, errorData);

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.getCurrentlyAuthenticatedAgent();
      const expected: ApiResultObject<unknown, FreshdeskAgent | undefined> = {
        data: undefined,
        endpoint: `${API_BASE_URL}/api/v2/agents/me`,
        method: "query",
        record: undefined,
        success: false,
        error: ["Request failed with status code 401"],
        errorDetails: errorData,
      };

      expect(actual).toEqual(expected);
    });
  });

  describe("listContacts()", () => {
    it("should list all contacts on success with no next page", async () => {
      const page = 1;
      const perPage = 10;
      nock(API_BASE_URL)
        .get(`/api/v2/contacts?page=${page}&per_page=${perPage}`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllContacts, {
          "Content-Type": "application/json",
        });

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listContacts(page, perPage);
      const expected: ApiResultObject<
        unknown,
        FreshdeskPagedResult<FreshdeskContact> | undefined
      > = {
        data: {
          results: ApiResponseListAllContacts,
          page,
          perPage,
          hasMore: false,
        },
        endpoint: `${API_BASE_URL}/api/v2/contacts?page=${page}&per_page=${perPage}`,
        method: "query",
        record: undefined,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should list all filtered contacts on success with no next page", async () => {
      const page = 1;
      const perPage = 10;
      nock(API_BASE_URL)
        .get(
          `/api/v2/contacts?page=${page}&per_page=${perPage}&_updated_since=2018-01-19T02:00:00Z`,
        )
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllContacts, {
          "Content-Type": "application/json",
        });

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listContacts(
        page,
        perPage,
        "_updated_since=2018-01-19T02:00:00Z",
      );
      const expected: ApiResultObject<
        unknown,
        FreshdeskPagedResult<FreshdeskContact> | undefined
      > = {
        data: {
          results: ApiResponseListAllContacts,
          page,
          perPage,
          hasMore: false,
        },
        endpoint: `${API_BASE_URL}/api/v2/contacts?page=${page}&per_page=${perPage}&_updated_since=2018-01-19T02:00:00Z`,
        method: "query",
        record: undefined,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should list all contacts on success with next page", async () => {
      const page = 1;
      const perPage = 10;
      nock(API_BASE_URL)
        .get(`/api/v2/contacts?page=${page}&per_page=${perPage}`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllContacts, {
          "Content-Type": "application/json",
          link: `<${API_BASE_URL}/api/v2/contacts?page=${
            page + 1
          }&per_page=${perPage}>;rel="next"`,
        });

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listContacts(page, perPage);
      const expected: ApiResultObject<
        unknown,
        FreshdeskPagedResult<FreshdeskContact> | undefined
      > = {
        data: {
          results: ApiResponseListAllContacts,
          page,
          perPage,
          hasMore: true,
        },
        endpoint: `${API_BASE_URL}/api/v2/contacts?page=${page}&per_page=${perPage}`,
        method: "query",
        record: undefined,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should return an error result and not throw if API responds with status 500", async () => {
      const page = 1;
      const perPage = 10;
      nock(API_BASE_URL)
        .get(`/api/v2/contacts?page=${page}&per_page=${perPage}`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .replyWithError("Some arbitrary error");

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listContacts(page, perPage);
      const expected: ApiResultObject<
        unknown,
        FreshdeskPagedResult<FreshdeskContact> | undefined
      > = {
        data: undefined,
        endpoint: `${API_BASE_URL}/api/v2/contacts?page=${page}&per_page=${perPage}`,
        method: "query",
        record: undefined,
        success: false,
        error: ["Some arbitrary error"],
      };

      expect(actual).toEqual(expected);
    });
  });

  describe("listCompanies()", () => {
    it("should list all companies on success with no next page", async () => {
      const page = 1;
      const perPage = 10;
      nock(API_BASE_URL)
        .get(`/api/v2/companies?page=${page}&per_page=${perPage}`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllCompanies, {
          "Content-Type": "application/json",
        });

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listCompanies(page, perPage);
      const expected: ApiResultObject<
        unknown,
        FreshdeskPagedResult<FreshdeskCompany> | undefined
      > = {
        data: {
          results: ApiResponseListAllCompanies,
          page,
          perPage,
          hasMore: false,
        },
        endpoint: `${API_BASE_URL}/api/v2/companies?page=${page}&per_page=${perPage}`,
        method: "query",
        record: undefined,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should list all companies on success with next page", async () => {
      const page = 1;
      const perPage = 10;
      nock(API_BASE_URL)
        .get(`/api/v2/companies?page=${page}&per_page=${perPage}`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllCompanies, {
          "Content-Type": "application/json",
          link: `<${API_BASE_URL}/api/v2/companies?page=${
            page + 1
          }&per_page=${perPage}>;rel="next"`,
        });

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listCompanies(page, perPage);
      const expected: ApiResultObject<
        unknown,
        FreshdeskPagedResult<FreshdeskCompany> | undefined
      > = {
        data: {
          results: ApiResponseListAllCompanies,
          page,
          perPage,
          hasMore: true,
        },
        endpoint: `${API_BASE_URL}/api/v2/companies?page=${page}&per_page=${perPage}`,
        method: "query",
        record: undefined,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should return an error result and not throw if API responds with status 500", async () => {
      const page = 1;
      const perPage = 10;
      nock(API_BASE_URL)
        .get(`/api/v2/companies?page=${page}&per_page=${perPage}`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .replyWithError("Some arbitrary error");

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listCompanies(page, perPage);
      const expected: ApiResultObject<
        unknown,
        FreshdeskPagedResult<FreshdeskCompany> | undefined
      > = {
        data: undefined,
        endpoint: `${API_BASE_URL}/api/v2/companies?page=${page}&per_page=${perPage}`,
        method: "query",
        record: undefined,
        success: false,
        error: ["Some arbitrary error"],
      };

      expect(actual).toEqual(expected);
    });
  });

  describe("listTickets()", () => {
    it("should list all tickets without any includes or time restriction with no next page", async () => {
      const page = 1;
      const perPage = 10;
      const orderBy = "updated_at";
      const orderDir = "desc";
      nock(API_BASE_URL)
        .get(
          `/api/v2/tickets?page=${page}&per_page=${perPage}&order_by=${orderBy}&order_type=${orderDir}`,
        )
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllTickets, {
          "Content-Type": "application/json",
        });

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listTickets(
        page,
        perPage,
        orderBy,
        orderDir,
        [],
      );
      const expected: ApiResultObject<
        unknown,
        FreshdeskPagedResult<FreshdeskTicket> | undefined
      > = {
        data: {
          results: ApiResponseListAllTickets,
          page,
          perPage,
          hasMore: false,
        },
        endpoint: `${API_BASE_URL}/api/v2/tickets?page=${page}&per_page=${perPage}&order_by=${orderBy}&order_type=${orderDir}`,
        method: "query",
        record: undefined,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should list all tickets with a single include and no time restriction with no next page", async () => {
      const page = 1;
      const perPage = 10;
      const orderBy = "updated_at";
      const orderDir = "desc";
      nock(API_BASE_URL)
        .get(
          `/api/v2/tickets?page=${page}&per_page=${perPage}&order_by=${orderBy}&order_type=${orderDir}&include=description`,
        )
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllTickets, {
          "Content-Type": "application/json",
        });

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listTickets(
        page,
        perPage,
        orderBy,
        orderDir,
        ["description"],
      );
      const expected: ApiResultObject<
        unknown,
        FreshdeskPagedResult<FreshdeskTicket> | undefined
      > = {
        data: {
          results: ApiResponseListAllTickets,
          page,
          perPage,
          hasMore: false,
        },
        endpoint: `${API_BASE_URL}/api/v2/tickets?page=${page}&per_page=${perPage}&order_by=${orderBy}&order_type=${orderDir}&include=description`,
        method: "query",
        record: undefined,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should list all tickets with multiple includes and time restriction with next page", async () => {
      const page = 1;
      const perPage = 10;
      const orderBy = "updated_at";
      const orderDir = "desc";
      nock(API_BASE_URL)
        .get(
          `/api/v2/tickets?page=${page}&per_page=${perPage}&order_by=${orderBy}&order_type=${orderDir}&include=description,stats&updated_since=${API_UPDATEDSINCE}`,
        )
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllTickets, {
          "Content-Type": "application/json",
          link: `<${API_BASE_URL}/api/v2/tickets?page=${
            page + 1
          }&per_page=${perPage}&order_by=${orderBy}&order_type=${orderDir}&include=description,stats&updated_since=${API_UPDATEDSINCE}>;rel="next"`,
        });

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listTickets(
        page,
        perPage,
        orderBy,
        orderDir,
        ["description", "stats"],
        API_UPDATEDSINCE,
      );
      const expected: ApiResultObject<
        unknown,
        FreshdeskPagedResult<FreshdeskTicket> | undefined
      > = {
        data: {
          results: ApiResponseListAllTickets,
          page,
          perPage,
          hasMore: true,
        },
        endpoint: `${API_BASE_URL}/api/v2/tickets?page=${page}&per_page=${perPage}&order_by=${orderBy}&order_type=${orderDir}&include=description,stats&updated_since=${API_UPDATEDSINCE}`,
        method: "query",
        record: undefined,
        success: true,
      };

      expect(actual).toEqual(expected);
    });

    it("should return an error result and not throw if API responds with status 500", async () => {
      const page = 1;
      const perPage = 10;
      const orderBy = "updated_at";
      const orderDir = "desc";
      nock(API_BASE_URL)
        .get(
          `/api/v2/tickets?page=${page}&per_page=${perPage}&order_by=${orderBy}&order_type=${orderDir}`,
        )
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .replyWithError("Some arbitrary error");

      const client = new ServiceClient({
        apiKey: API_KEY,
        domain: API_DOMAIN,
        logger: console,
      });
      const actual = await client.listTickets(
        page,
        perPage,
        orderBy,
        orderDir,
        [],
      );
      const expected: ApiResultObject<
        unknown,
        FreshdeskPagedResult<FreshdeskTicket> | undefined
      > = {
        data: undefined,
        endpoint: `${API_BASE_URL}/api/v2/tickets?page=${page}&per_page=${perPage}&order_by=${orderBy}&order_type=${orderDir}`,
        method: "query",
        record: undefined,
        success: false,
        error: ["Some arbitrary error"],
      };

      expect(actual).toEqual(expected);
    });
  });
});

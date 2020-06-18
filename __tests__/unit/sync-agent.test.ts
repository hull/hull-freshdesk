import { AwilixContainer, createContainer, asClass, asValue } from "awilix";
import { ContextMock } from "../_helpers/mocks";
import { SyncAgent } from "../../src/core/sync-agent";
import { ConnectorStatusResponse } from "../../src/types/connector-status";
import { API_KEY, API_BASE_URL, API_DOMAIN } from "../_helpers/constants";
import _ from "lodash";
import ApiResponseListAllContactFields from "../_data/api__list_all_contact_fields.json";
import ApiResponseListAllCompanyFields from "../_data/api__list_all_company_fields.json";
import { FieldsSchema } from "../../src/types/fields-schema";
import nock from "nock";

describe("SyncAgent", () => {
  let ctxMock: ContextMock;
  let container: AwilixContainer;
  beforeEach(() => {
    nock.cleanAll();
    nock.restore();

    if (!nock.isActive()) {
      nock.activate();
    }

    ctxMock = new ContextMock(
      "1234",
      {},
      {
        contact_synchronized_segments: [],
        contact_attributes_outbound: [],
        contact_attributes_inbound: [],
        account_synchronized_segments: [],
        account_attributes_outbound: [],
        account_attributes_inbound: [],
        account_filter_inbound_require_domain: false,
      },
    );

    container = createContainer();
    container.register("logger", asValue(console));
  });

  afterEach(() => {
    nock.cleanAll();
    nock.restore();

    container.dispose();
  });

  it("should pass smoke test", () => {
    expect(ctxMock).toBeDefined();
  });

  describe("constructor()", () => {
    it("should initialize the readonly variables", () => {
      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );
      expect(agent.diContainer).toBeDefined();
      expect(agent.hullClient).toBeDefined();
      expect(agent.hullConnector).toBeDefined();
      expect(agent.metricsClient).toBeDefined();
      expect(agent.privateSettings).toBeDefined();
    });
  });

  describe("sendUserMessages()", () => {
    it("should return true", async () => {
      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      const actual = await agent.sendUserMessages([]);

      expect(actual).toBeTruthy();
    });
  });

  describe("sendAccountMessages()", () => {
    it("should return true", async () => {
      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      const actual = await agent.sendAccountMessages([]);

      expect(actual).toBeTruthy();
    });
  });

  describe("determineConnectorStatus()", () => {
    it("should return true", async () => {
      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      const actual = await agent.determineConnectorStatus();
      const expected: ConnectorStatusResponse = {
        status: "ok",
        messages: [],
      };

      expect(actual).toEqual(expected);
    });
  });

  describe("getMetadataFields()", () => {
    it("should return the fields for contacts on success", async () => {
      nock(API_BASE_URL)
        .get("/api/v2/contact_fields")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllContactFields, {
          "Content-Type": "application/json",
        });

      _.set(ctxMock, "connector.private_settings.api_key", API_KEY);
      _.set(ctxMock, "connector.private_settings.domain", API_DOMAIN);
      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      const actual = await agent.getMetadataFields("contact");
      const expected: FieldsSchema = {
        ok: true,
        error: null,
        options: _.map(ApiResponseListAllContactFields, (f) => {
          return {
            value: f.name,
            label: f.label,
          };
        }),
      };

      expect(actual).toEqual(expected);
    });

    it("should return the fields for companies on success", async () => {
      nock(API_BASE_URL)
        .get("/api/v2/company_fields")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllCompanyFields, {
          "Content-Type": "application/json",
        });

      _.set(ctxMock, "connector.private_settings.api_key", API_KEY);
      _.set(ctxMock, "connector.private_settings.domain", API_DOMAIN);
      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      const actual = await agent.getMetadataFields("company");
      const expected: FieldsSchema = {
        ok: true,
        error: null,
        options: _.map(ApiResponseListAllCompanyFields, (f) => {
          return {
            value: f.name,
            label: f.label,
          };
        }),
      };

      expect(actual).toEqual(expected);
    });

    it("should return error for contacts if the Freshdesk API returns an error code", async () => {
      nock(API_BASE_URL)
        .get("/api/v2/contact_fields")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .replyWithError("Some arbitrary error");

      _.set(ctxMock, "connector.private_settings.api_key", API_KEY);
      _.set(ctxMock, "connector.private_settings.domain", API_DOMAIN);
      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      const actual = await agent.getMetadataFields("contact");
      const expected: FieldsSchema = {
        ok: false,
        error: "Some arbitrary error",
        options: [],
      };

      expect(actual).toEqual(expected);
    });

    it("should return error for companies if the Freshdesk API returns an error code", async () => {
      nock(API_BASE_URL)
        .get("/api/v2/company_fields")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .replyWithError("Some arbitrary error");

      _.set(ctxMock, "connector.private_settings.api_key", API_KEY);
      _.set(ctxMock, "connector.private_settings.domain", API_DOMAIN);
      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      const actual = await agent.getMetadataFields("company");
      const expected: FieldsSchema = {
        ok: false,
        error: "Some arbitrary error",
        options: [],
      };

      expect(actual).toEqual(expected);
    });

    it("should return error if no API key is present", async () => {
      _.set(ctxMock, "connector.private_settings.domain", API_DOMAIN);
      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      const actual = await agent.getMetadataFields("contact");
      const expected: FieldsSchema = {
        ok: false,
        error:
          "Failed to fetch fields from Freshdesk API: 'Unable to communicate with the Freshdesk API since no API Key has been configured.'",
        options: [],
      };

      expect(actual).toEqual(expected);
    });
  });
});

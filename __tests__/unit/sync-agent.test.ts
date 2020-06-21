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
import { PrivateSettings } from "../../src/types/private-settings";
import {
  STATUS_SETUPREQUIRED_NOAPIKEY,
  STATUS_SETUPREQUIRED_NODOMAIN,
  STATUS_SETUPREQUIRED_NOLOOKUPACCTDOMAIN,
  STATUS_SETUPREQUIRED_NOLOOKUPCONTACTEMAIL,
  STATUS_WARN_FIELDDOESNTEXIST,
  STATUS_ERROR_AUTHN,
} from "../../src/core/messages";
import ApiResponseCurrentlyAuthenticatedAgent from "../_data/api_me.json";

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
    it("should return false", async () => {
      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      const actual = await agent.sendUserMessages([]);

      expect(actual).toBeFalsy();
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
    it("should return status 'ok' with no messages if properly configured", async () => {
      const privateSettings: PrivateSettings = {
        account_attributes_inbound: [],
        account_attributes_outbound: [],
        account_filter_inbound_require_domain: false,
        account_synchronized_segments: [],
        contact_attributes_inbound: [],
        contact_attributes_outbound: [],
        contact_synchronized_segments: [],
        account_lookup_attribute_domain: "domain",
        api_key: API_KEY,
        contact_lookup_attribute_email: "email",
        domain: API_DOMAIN,
      };

      const ctx = {
        ...ctxMock,
      };

      _.set(ctx, "connector.private_settings", privateSettings);

      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      nock(API_BASE_URL)
        .get(`/api/v2/agents/me`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseCurrentlyAuthenticatedAgent, {
          "Content-Type": "application/json",
        });

      nock(`https://${API_DOMAIN}.freshdesk.com`)
        .get("/api/v2/contact_fields")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllContactFields, {
          "Content-Type": "application/json",
        });

      nock(`https://${API_DOMAIN}.freshdesk.com`)
        .get("/api/v2/company_fields")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllCompanyFields, {
          "Content-Type": "application/json",
        });

      const actual = await agent.determineConnectorStatus();
      const expected: ConnectorStatusResponse = {
        status: "ok",
        messages: [],
      };

      expect(actual).toEqual(expected);
    });

    it("should return status 'setupRequired' with messages if api_key is missing", async () => {
      const privateSettings: PrivateSettings = {
        account_attributes_inbound: [],
        account_attributes_outbound: [],
        account_filter_inbound_require_domain: false,
        account_synchronized_segments: [],
        contact_attributes_inbound: [],
        contact_attributes_outbound: [],
        contact_synchronized_segments: [],
        account_lookup_attribute_domain: "domain",
        contact_lookup_attribute_email: "email",
        domain: API_DOMAIN,
      };

      const ctx = {
        ...ctxMock,
      };

      _.set(ctx, "connector.private_settings", privateSettings);

      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      const actual = await agent.determineConnectorStatus();
      const expected: ConnectorStatusResponse = {
        status: "setupRequired",
        messages: [STATUS_SETUPREQUIRED_NOAPIKEY],
      };

      expect(actual).toEqual(expected);
    });

    it("should return status 'setupRequired' with messages if domain is missing", async () => {
      const privateSettings: PrivateSettings = {
        account_attributes_inbound: [],
        account_attributes_outbound: [],
        account_filter_inbound_require_domain: false,
        account_synchronized_segments: [],
        api_key: API_KEY,
        contact_attributes_inbound: [],
        contact_attributes_outbound: [],
        contact_synchronized_segments: [],
        account_lookup_attribute_domain: "domain",
        contact_lookup_attribute_email: "email",
      };

      const ctx = {
        ...ctxMock,
      };

      _.set(ctx, "connector.private_settings", privateSettings);

      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      const actual = await agent.determineConnectorStatus();
      const expected: ConnectorStatusResponse = {
        status: "setupRequired",
        messages: [STATUS_SETUPREQUIRED_NODOMAIN],
      };

      expect(actual).toEqual(expected);
    });

    it("should return status 'setupRequired' with messages if account_lookup_attribute_domain is missing", async () => {
      const privateSettings: PrivateSettings = {
        account_attributes_inbound: [],
        account_attributes_outbound: [],
        account_filter_inbound_require_domain: false,
        account_synchronized_segments: [],
        api_key: API_KEY,
        contact_attributes_inbound: [],
        contact_attributes_outbound: [],
        contact_synchronized_segments: [],
        contact_lookup_attribute_email: "email",
        domain: API_DOMAIN,
      };

      const ctx = {
        ...ctxMock,
      };

      _.set(ctx, "connector.private_settings", privateSettings);

      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      const actual = await agent.determineConnectorStatus();
      const expected: ConnectorStatusResponse = {
        status: "setupRequired",
        messages: [STATUS_SETUPREQUIRED_NOLOOKUPACCTDOMAIN],
      };

      expect(actual).toEqual(expected);
    });

    it("should return status 'setupRequired' with messages if contact_lookup_attribute_email is missing", async () => {
      const privateSettings: PrivateSettings = {
        account_attributes_inbound: [],
        account_attributes_outbound: [],
        account_filter_inbound_require_domain: false,
        account_synchronized_segments: [],
        api_key: API_KEY,
        contact_attributes_inbound: [],
        contact_attributes_outbound: [],
        contact_synchronized_segments: [],
        account_lookup_attribute_domain: "domain",

        domain: API_DOMAIN,
      };

      const ctx = {
        ...ctxMock,
      };

      _.set(ctx, "connector.private_settings", privateSettings);

      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      const actual = await agent.determineConnectorStatus();
      const expected: ConnectorStatusResponse = {
        status: "setupRequired",
        messages: [STATUS_SETUPREQUIRED_NOLOOKUPCONTACTEMAIL],
      };

      expect(actual).toEqual(expected);
    });

    it("should return status 'warning' with messages if any attribute mapping is invalid", async () => {
      const privateSettings: PrivateSettings = {
        account_attributes_inbound: [],
        account_attributes_outbound: [
          {
            hull: "test/foo",
            service: "foo",
            overwrite: true,
          },
        ],
        account_filter_inbound_require_domain: false,
        account_synchronized_segments: [],
        contact_attributes_inbound: [
          {
            hull: "traits_freshdesk/baz",
            service: "baz",
            overwrite: true,
          },
        ],
        contact_attributes_outbound: [],
        contact_synchronized_segments: [],
        account_lookup_attribute_domain: "domain",
        api_key: API_KEY,
        contact_lookup_attribute_email: "email",
        domain: API_DOMAIN,
      };

      const ctx = {
        ...ctxMock,
      };

      _.set(ctx, "connector.private_settings", privateSettings);

      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      nock(API_BASE_URL)
        .get(`/api/v2/agents/me`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseCurrentlyAuthenticatedAgent, {
          "Content-Type": "application/json",
        });

      nock(`https://${API_DOMAIN}.freshdesk.com`)
        .get("/api/v2/contact_fields")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllContactFields, {
          "Content-Type": "application/json",
        });

      nock(`https://${API_DOMAIN}.freshdesk.com`)
        .get("/api/v2/company_fields")
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(200, ApiResponseListAllCompanyFields, {
          "Content-Type": "application/json",
        });

      const actual = await agent.determineConnectorStatus();

      expect(actual.status).toEqual("warning");
      expect(actual.messages).toContain(
        STATUS_WARN_FIELDDOESNTEXIST("foo", "Companies > Outgoing Attributes"),
      );
      expect(actual.messages).toContain(
        STATUS_WARN_FIELDDOESNTEXIST("baz", "Contacts > Incoming Fields"),
      );
    });

    it("should return status 'error' with messages if Freshdesk API returns 401", async () => {
      const privateSettings: PrivateSettings = {
        account_attributes_inbound: [],
        account_attributes_outbound: [],
        account_filter_inbound_require_domain: false,
        account_synchronized_segments: [],
        contact_attributes_inbound: [
          {
            hull: "traits_freshdesk/baz",
            service: "baz",
            overwrite: true,
          },
        ],
        contact_attributes_outbound: [],
        contact_synchronized_segments: [],
        account_lookup_attribute_domain: "domain",
        api_key: API_KEY,
        contact_lookup_attribute_email: "email",
        domain: API_DOMAIN,
      };

      const ctx = {
        ...ctxMock,
      };

      _.set(ctx, "connector.private_settings", privateSettings);

      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

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

      const errorDetails = `Description: '${
        errorData.description
      }' Errors: ${errorData.errors
        .map((e) => `${e.message} (code: ${e.code})`)
        .join(" ")}`;
      const actual = await agent.determineConnectorStatus();

      expect(actual.status).toEqual("error");
      expect(actual.messages).toContain(STATUS_ERROR_AUTHN(errorDetails));
    });

    it("should return status 'error' with messages if Freshdesk API returns error code without details", async () => {
      const privateSettings: PrivateSettings = {
        account_attributes_inbound: [],
        account_attributes_outbound: [],
        account_filter_inbound_require_domain: false,
        account_synchronized_segments: [],
        contact_attributes_inbound: [
          {
            hull: "traits_freshdesk/baz",
            service: "baz",
            overwrite: true,
          },
        ],
        contact_attributes_outbound: [],
        contact_synchronized_segments: [],
        account_lookup_attribute_domain: "domain",
        api_key: API_KEY,
        contact_lookup_attribute_email: "email",
        domain: API_DOMAIN,
      };

      const ctx = {
        ...ctxMock,
      };

      _.set(ctx, "connector.private_settings", privateSettings);

      const agent = new SyncAgent(
        ctxMock.client,
        ctxMock.connector,
        ctxMock.metric,
        container,
      );

      nock(API_BASE_URL)
        .get(`/api/v2/agents/me`)
        .matchHeader(
          "authorization",
          `Basic ${Buffer.from(`${API_KEY}:X`, "utf-8").toString("base64")}`,
        )
        .reply(401);

      const errorDetails = `Request failed with status code 401`;
      const actual = await agent.determineConnectorStatus();

      expect(actual.status).toEqual("error");
      expect(actual.messages).toContain(STATUS_ERROR_AUTHN(errorDetails));
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

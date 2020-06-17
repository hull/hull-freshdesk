import { AwilixContainer, createContainer, asClass, asValue } from "awilix";
import { ContextMock } from "../_helpers/mocks";
import { SyncAgent } from "../../src/core/sync-agent";
import { ConnectorStatusResponse } from "../../src/types/connector-status";

describe("SyncAgent", () => {
  let ctxMock: ContextMock;
  let container: AwilixContainer;
  beforeEach(() => {
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
  });

  afterEach(() => {
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
});

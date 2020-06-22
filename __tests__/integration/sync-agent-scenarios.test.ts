import nock from "nock";
import _ from "lodash";
import { AwilixContainer, createContainer } from "awilix";
import { ContextMock } from "../_helpers/mocks";
import { SyncAgent } from "../../src/core/sync-agent";

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
    nock.cleanAll();
    container.dispose();
  });

  it("should pass smoke test", () => {
    expect(ctxMock).toBeDefined();
  });

  describe("handle contact scenario", () => {
    const scenarios = [
      "user-nomatchingsegments-skip",
      "user-validdata-insert",
      "user-validdata-nofdid-update",
      "user-validdata-fdid-update",
    ];
    _.forEach(scenarios, (scenarioName) => {
      it(`should process '${scenarioName}' properly`, async () => {
        // Arrange Payload from smart-notifier
        const payloadSetupFn: () => any = require(`../_scenarios/${scenarioName}/smart-notifier-payload`)
          .default;
        const smartNotifierPayload = payloadSetupFn();
        ctxMock.connector = smartNotifierPayload.connector;
        ctxMock.ship = smartNotifierPayload.connector;

        // Arrange Awilix Container Setup
        const containerSetupFn: (
          container: AwilixContainer,
        ) => void = require(`../_scenarios/${scenarioName}/container-setup`)
          .default;
        containerSetupFn(container);

        const syncAgent = new SyncAgent(
          ctxMock.client,
          ctxMock.connector,
          ctxMock.metric,
          container,
        );

        const apiResponseSetupFn: (
          nock: any,
        ) => void = require(`../_scenarios/${scenarioName}/api-responses`)
          .default;
        apiResponseSetupFn(nock);

        await syncAgent.sendUserMessages(smartNotifierPayload.messages);
        const ctxExpectationsFn: (
          ctx: ContextMock,
        ) => void = require(`../_scenarios/${scenarioName}/ctx-expectations`)
          .default;
        ctxExpectationsFn(ctxMock);
        expect(nock.isDone()).toBe(true);
      });
    });
  });

  describe("handle account scenario", () => {
    const scenarios: string[] = [
      "account-nomatchingsegments-skip",
      "account-validdata-insert",
      "account-validdata-nofdid-update",
      "account-validdata-fdid-update",
    ];
    _.forEach(scenarios, (scenarioName) => {
      it(`should process '${scenarioName}' properly`, async () => {
        // Arrange Payload from smart-notifier
        const payloadSetupFn: () => any = require(`../_scenarios/${scenarioName}/smart-notifier-payload`)
          .default;
        const smartNotifierPayload = payloadSetupFn();
        ctxMock.connector = smartNotifierPayload.connector;
        ctxMock.ship = smartNotifierPayload.connector;

        // Arrange Awilix Container Setup
        const containerSetupFn: (
          container: AwilixContainer,
        ) => void = require(`../_scenarios/${scenarioName}/container-setup`)
          .default;
        containerSetupFn(container);

        const syncAgent = new SyncAgent(
          ctxMock.client,
          ctxMock.connector,
          ctxMock.metric,
          container,
        );

        const apiResponseSetupFn: (
          nock: any,
        ) => void = require(`../_scenarios/${scenarioName}/api-responses`)
          .default;
        apiResponseSetupFn(nock);

        await syncAgent.sendAccountMessages(smartNotifierPayload.messages);
        const ctxExpectationsFn: (
          ctx: ContextMock,
        ) => void = require(`../_scenarios/${scenarioName}/ctx-expectations`)
          .default;
        ctxExpectationsFn(ctxMock);
        expect(nock.isDone()).toBe(true);
      });
    });
  });
});

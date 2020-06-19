import IHullClient from "../types/hull-client";
import { AwilixContainer, asValue, asClass, Lifetime } from "awilix";
import { PrivateSettings } from "../types/private-settings";
import _ from "lodash";
import IHullUserUpdateMessage from "../types/user-update-message";
import { ConnectorStatusResponse } from "../types/connector-status";
import IHullAccountUpdateMessage from "../types/account-update-message";
import {
  FreshdeskObjectMetaType,
  OutgoingOperationEnvelopesFiltered,
  FreshdeskContactCreateUpdate,
  OutgoingOperationEnvelope,
} from "./service-objects";
import { FieldsSchema } from "../types/fields-schema";
import { ServiceClient } from "./service-client";
import { FilterUtil } from "../utils/filter-util";
import asyncForEach from "../utils/async-foreach";
import { MappingUtil } from "../utils/mapping-util";

export class SyncAgent {
  readonly hullClient: IHullClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly metricsClient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly hullConnector: any;

  readonly diContainer: AwilixContainer;

  readonly privateSettings: PrivateSettings;

  constructor(
    client: IHullClient,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connector: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metricsClient: any,
    container: AwilixContainer,
  ) {
    this.diContainer = container;
    this.diContainer.register("hullClient", asValue(client));
    this.hullClient = client;
    this.metricsClient = metricsClient;
    this.hullConnector = connector;
    // Obtain the private settings
    this.privateSettings = _.get(
      connector,
      "private_settings",
    ) as PrivateSettings;
    this.diContainer.register("privateSettings", asValue(this.privateSettings));
    this.diContainer.register("apiKey", asValue(this.privateSettings.api_key));
    this.diContainer.register("domain", asValue(this.privateSettings.domain));
    this.diContainer.register(
      "serviceClient",
      asClass(ServiceClient, { lifetime: Lifetime.SINGLETON }),
    );
    this.diContainer.register("filterUtil", asClass(FilterUtil));
  }

  /**
   * Processes outgoing notifications for user:update lane.
   *
   * @param {IHullUserUpdateMessage[]} messages The notification messages.
   * @param {boolean} [isBatch=false] `True` if it is a batch; otherwise `false`.
   * @returns {Promise<unknown>} An awaitable Promise.
   * @memberof SyncAgent
   */
  public async sendUserMessages(
    messages: IHullUserUpdateMessage[],
    isBatch = false,
  ): Promise<unknown> {
    if (
      _.isNil(this.privateSettings.api_key) ||
      _.isNil(this.privateSettings.domain)
    ) {
      return Promise.resolve(false);
    }

    const filterUtil = this.diContainer.resolve<FilterUtil>("filterUtil");

    const envelopesFiltered = filterUtil.filterUserMessagesInitial(messages);
    console.log(envelopesFiltered);
    envelopesFiltered.skips.forEach((envelope) => {
      this.hullClient
        .asUser(envelope.message.user)
        .logger.info("outgoing.user.skip", { details: envelope.notes });
    });

    if (
      envelopesFiltered.inserts.length === 0 &&
      envelopesFiltered.updates.length === 0
    ) {
      return Promise.resolve(true);
    }

    const serviceClient = this.diContainer.resolve<ServiceClient>(
      "serviceClient",
    );
    const contactFieldsResponse = await serviceClient.listContactFields();
    const companyFieldsResponse = await serviceClient.listCompanyFields();
    this.diContainer.register(
      "contactFields",
      asValue(contactFieldsResponse.data),
    );
    this.diContainer.register(
      "companyFields",
      asValue(companyFieldsResponse.data),
    );
    this.diContainer.register("mappingUtil", asClass(MappingUtil));

    if (envelopesFiltered.inserts.length > 0) {
      const mappingUtil = this.diContainer.resolve<MappingUtil>("mappingUtil");
      console.log(">>> Mapping Util", mappingUtil);
      envelopesFiltered.inserts = _.map(
        envelopesFiltered.inserts,
        (envelope) => {
          return mappingUtil.mapHullUserToServiceObject(envelope);
        },
      );
      await asyncForEach(
        envelopesFiltered.inserts,
        async (
          op: OutgoingOperationEnvelope<
            IHullUserUpdateMessage,
            FreshdeskContactCreateUpdate
          >,
        ) => {
          if (op.serviceObject !== undefined) {
            const createResult = await serviceClient.createContact(
              op.serviceObject,
            );
            if (createResult.success && createResult.data !== undefined) {
              const hullInfo = mappingUtil.mapServiceObjectToHullUser(
                createResult.data,
              );
              const userIdent = {
                ...hullInfo.ident,
                id: op.message.user.id,
              };
              await this.hullClient
                .asUser(userIdent)
                .traits(hullInfo.attributes);
              this.hullClient
                .asUser(userIdent)
                .logger.info("outgoing.user.success", {
                  data: op.serviceObject,
                  operation: op.operation,
                  details: op.notes,
                });
            }
          }
        },
      );
    }

    return Promise.resolve(true);
  }

  /**
   * Processes outgoing notifications for account:update lane.
   *
   * @param {IHullAccountUpdateMessage[]} messages The notification messages.
   * @param {boolean} [isBatch=false] `True` if it is a batch; otherwise `false`.
   * @returns {Promise<unknown>} An awaitable Promise.
   * @memberof SyncAgent
   */
  public async sendAccountMessages(
    messages: IHullAccountUpdateMessage[],
    isBatch = false,
  ): Promise<unknown> {
    return Promise.resolve(true);
  }

  /**
   * Determines the overall status of the connector.
   *
   * @returns {Promise<ConnectorStatusResponse>} The status response.
   * @memberof SyncAgent
   */
  public async determineConnectorStatus(): Promise<ConnectorStatusResponse> {
    const status: ConnectorStatusResponse = {
      status: "ok",
      messages: [],
    };

    return Promise.resolve(status);
  }

  /**
   * Returns the fields schema for the given object type.
   *
   * @param {FreshdeskObjectMetaType} objectType The Freshdesk Object Type to return the fields for.
   * @returns {Promise<FieldsSchema>} The fields schema to display in connector settings.
   * @memberof SyncAgent
   */
  public async getMetadataFields(
    objectType: FreshdeskObjectMetaType,
  ): Promise<FieldsSchema> {
    let fieldsSchema: FieldsSchema = {
      ok: true,
      error: null,
      options: [],
    };

    try {
      if (
        this.privateSettings.api_key === undefined ||
        this.privateSettings.api_key === null
      ) {
        throw new Error(
          "Unable to communicate with the Freshdesk API since no API Key has been configured.",
        );
      }

      const clnt = this.diContainer.resolve<ServiceClient>("serviceClient");
      switch (objectType) {
        case "company":
          const fieldsResultCompany = await clnt.listCompanyFields();
          if (fieldsResultCompany.success) {
            fieldsSchema.options = _.map(fieldsResultCompany.data, (f) => {
              return {
                value: f.name,
                label: f.label,
              };
            });
          } else {
            fieldsSchema.ok = false;
            if (fieldsResultCompany.error !== undefined) {
              fieldsSchema.error = _.isArray(fieldsResultCompany.error)
                ? fieldsResultCompany.error.join(" ").trim()
                : fieldsResultCompany.error;
            } else {
              fieldsSchema.error =
                "Failed to fetch all company fields from Freshdesk API.";
            }
          }
          break;
        default:
          const fieldsResult = await clnt.listContactFields();
          if (fieldsResult.success) {
            fieldsSchema.options = _.map(fieldsResult.data, (f) => {
              return {
                value: f.name,
                label: f.label,
              };
            });
          } else {
            fieldsSchema.ok = false;
            if (fieldsResult.error !== undefined) {
              fieldsSchema.error = _.isArray(fieldsResult.error)
                ? fieldsResult.error.join(" ").trim()
                : fieldsResult.error;
            } else {
              fieldsSchema.error =
                "Failed to fetch all contact fields from Freshdesk API.";
            }
          }
          break;
      }
    } catch (error) {
      fieldsSchema.ok = false;
      fieldsSchema.options = [];
      fieldsSchema.error = `Failed to fetch fields from Freshdesk API: '${error.message}'`;
    } finally {
      return fieldsSchema;
    }
  }
}

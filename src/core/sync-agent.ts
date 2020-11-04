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
  FreshdeskCompanyField,
  FreshdeskContactField,
  FreshdeskContact,
  FreshdeskCompanyCreateOrUpdate,
  FreshdeskCompany,
  FreshdeskPagedResult,
  FreshdeskTicket,
} from "./service-objects";
import { FieldsSchema } from "../types/fields-schema";
import { ServiceClient } from "./service-client";
import { FilterUtil } from "../utils/filter-util";
import asyncForEach from "../utils/async-foreach";
import { MappingUtil } from "../utils/mapping-util";
import {
  STATUS_SETUPREQUIRED_NOAPIKEY,
  STATUS_SETUPREQUIRED_NODOMAIN,
  STATUS_SETUPREQUIRED_NOLOOKUPACCTDOMAIN,
  STATUS_SETUPREQUIRED_NOLOOKUPCONTACTEMAIL,
  STATUS_ERROR_AUTHN,
  ERROR_AUTHN_INCOMPLETE,
} from "./messages";
import { ValidationUtil } from "../utils/validation-util";
import { CachingUtil } from "../utils/caching-util";

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
    this.diContainer.register("serviceClient", asClass(ServiceClient));
    this.diContainer.register("filterUtil", asClass(FilterUtil));
    this.diContainer.register("validationUtil", asClass(ValidationUtil));
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
    let envelopesFiltered = filterUtil.filterUserMessagesInitial(
      messages,
      isBatch,
    );
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
    const mappingUtil = this.diContainer.resolve<MappingUtil>("mappingUtil");

    if (envelopesFiltered.inserts.length > 0) {
      envelopesFiltered.inserts = _.map(
        envelopesFiltered.inserts,
        (envelope) => {
          return mappingUtil.mapHullUserToServiceObject(envelope);
        },
      );

      // Check if the users do not already exist in Freshdesk
      const emailsToFilter = envelopesFiltered.inserts.map((env) => {
        if (env.serviceObject) {
          return env.serviceObject.email;
        }
      });
      const queryStringsFilter: string[] = [];
      let queryStringFilterCurrent = ``;
      emailsToFilter.forEach((email, i) => {
        if (email && email.length !== 0) {
          if (queryStringFilterCurrent.length !== 0) {
            if (queryStringFilterCurrent.length + 4 + 3 + email.length > 511) {
              // Check if max length reached, if so reset the current filter
              queryStringsFilter.push(
                _.cloneDeep(queryStringFilterCurrent.trim()),
              );
              queryStringFilterCurrent = "";
            } else {
              queryStringFilterCurrent += " OR";
            }
          }

          queryStringFilterCurrent += ` email:'${email}'`;
        }

        if (i === emailsToFilter.length - 1) {
          queryStringsFilter.push(_.cloneDeep(queryStringFilterCurrent.trim()));
        }
      });
      const queriedServiceObjects: FreshdeskContact[] = [];
      await asyncForEach(queryStringsFilter, async (q: string) => {
        const filterResult = await serviceClient.filterContacts(q);
        if (
          filterResult.success &&
          filterResult.data &&
          filterResult.data.total !== 0
        ) {
          queriedServiceObjects.push(...filterResult.data.results);
        }
      });
      envelopesFiltered = filterUtil.filterUserEnvelopesToReevaluateForUpdate(
        envelopesFiltered,
        queriedServiceObjects,
      );
      // Perform the inserts
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
            } else {
              console.error(createResult.errorDetails);
              const userIdent = {
                id: op.message.user.id,
                email: op.message.user.email,
              };
              this.hullClient
                .asUser(userIdent)
                .logger.error("outgoing.user.error", {
                  error: createResult.errorDetails,
                });
            }
          }
        },
      );
    }

    // Ensure we have on all update envelopes the serviceObject
    envelopesFiltered.updates = _.map(envelopesFiltered.updates, (envelope) => {
      return mappingUtil.mapHullUserToServiceObject(envelope);
    });

    // Perform the updates
    await asyncForEach(
      envelopesFiltered.updates,
      async (
        op: OutgoingOperationEnvelope<
          IHullUserUpdateMessage,
          FreshdeskContactCreateUpdate
        >,
      ) => {
        if (op.serviceObject !== undefined && op.serviceId !== undefined) {
          const updateResult = await serviceClient.updateContact(
            op.serviceId,
            op.serviceObject,
          );
          if (updateResult.success && updateResult.data !== undefined) {
            const hullInfo = mappingUtil.mapServiceObjectToHullUser(
              updateResult.data,
            );
            const userIdent = {
              ...hullInfo.ident,
              id: op.message.user.id,
            };
            await this.hullClient.asUser(userIdent).traits(hullInfo.attributes);
            this.hullClient
              .asUser(userIdent)
              .logger.info("outgoing.user.success", {
                data: op.serviceObject,
                operation: op.operation,
                details: op.notes,
              });
          } else {
            console.error(updateResult.errorDetails);
            const userIdent = {
              id: op.message.user.id,
              email: op.message.user.email,
            };
            this.hullClient
              .asUser(userIdent)
              .logger.error("outgoing.user.error", {
                error: updateResult.errorDetails,
              });
          }
        }
      },
    );

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
    if (
      _.isNil(this.privateSettings.api_key) ||
      _.isNil(this.privateSettings.domain)
    ) {
      return Promise.resolve(false);
    }

    const filterUtil = this.diContainer.resolve<FilterUtil>("filterUtil");

    let envelopesFiltered = filterUtil.filterAccountMessagesInitial(
      messages,
      isBatch,
    );
    envelopesFiltered.skips.forEach((envelope) => {
      this.hullClient
        .asAccount(envelope.message.account)
        .logger.info("outgoing.account.skip", { details: envelope.notes });
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
    const mappingUtil = this.diContainer.resolve<MappingUtil>("mappingUtil");

    if (envelopesFiltered.inserts.length > 0) {
      envelopesFiltered.inserts = _.map(
        envelopesFiltered.inserts,
        (envelope) => {
          return mappingUtil.mapHullAccountToServiceObject(envelope);
        },
      );

      // Check if the users do not already exist in Freshdesk
      const domainsToFilter = envelopesFiltered.inserts.map((env) => {
        if (env.serviceObject) {
          if (
            env.serviceObject.domains !== undefined &&
            env.serviceObject.domains !== null
          ) {
            return env.serviceObject.domains[0];
          }
        }
      });
      const queryStringsFilter: string[] = [];
      let queryStringFilterCurrent = ``;
      domainsToFilter.forEach((domain, i) => {
        if (domain && domain.length !== 0) {
          if (queryStringFilterCurrent.length !== 0) {
            if (queryStringFilterCurrent.length + 6 + 3 + domain.length > 511) {
              // Check if max length reached, if so reset the current filter
              queryStringsFilter.push(
                _.cloneDeep(queryStringFilterCurrent.trim()),
              );
              queryStringFilterCurrent = "";
            } else {
              queryStringFilterCurrent += " OR";
            }
          }

          queryStringFilterCurrent += ` domain:'${domain}'`;
        }

        if (i === domainsToFilter.length - 1) {
          queryStringsFilter.push(_.cloneDeep(queryStringFilterCurrent.trim()));
        }
      });
      const queriedServiceObjects: FreshdeskCompany[] = [];
      await asyncForEach(queryStringsFilter, async (q: string) => {
        const filterResult = await serviceClient.filterCompanies(q);
        if (
          filterResult.success &&
          filterResult.data &&
          filterResult.data.total !== 0
        ) {
          queriedServiceObjects.push(...filterResult.data.results);
        }
      });
      envelopesFiltered = filterUtil.filterAccountEnvelopesToReevaluateForUpdate(
        envelopesFiltered,
        queriedServiceObjects,
      );

      // Perform the inserts
      await asyncForEach(
        envelopesFiltered.inserts,
        async (
          op: OutgoingOperationEnvelope<
            IHullAccountUpdateMessage,
            FreshdeskCompanyCreateOrUpdate
          >,
        ) => {
          if (op.serviceObject !== undefined) {
            const createResult = await serviceClient.createCompany(
              op.serviceObject,
            );
            if (createResult.success && createResult.data !== undefined) {
              const hullInfo = mappingUtil.mapServiceObjectToHullAccount(
                createResult.data,
              );
              const accountIdent = {
                ...hullInfo.ident,
                id: op.message.account.id,
              };
              await this.hullClient
                .asAccount(accountIdent)
                .traits(hullInfo.attributes);
              this.hullClient
                .asAccount(accountIdent)
                .logger.info("outgoing.account.success", {
                  data: op.serviceObject,
                  operation: op.operation,
                  details: op.notes,
                });
            } else {
              console.error(createResult.errorDetails);
              const accountIdent = {
                id: op.message.account.id,
                domain: op.message.account.domain,
              };
              this.hullClient
                .asAccount(accountIdent)
                .logger.error("outgoing.account.error", {
                  error: createResult.errorDetails,
                });
            }
          }
        },
      );
    }

    // Ensure we have on all update envelopes the serviceObject
    envelopesFiltered.updates = _.map(envelopesFiltered.updates, (envelope) => {
      return mappingUtil.mapHullAccountToServiceObject(envelope);
    });

    // Perform the updates
    await asyncForEach(
      envelopesFiltered.updates,
      async (
        op: OutgoingOperationEnvelope<
          IHullAccountUpdateMessage,
          FreshdeskCompanyCreateOrUpdate
        >,
      ) => {
        if (op.serviceObject !== undefined && op.serviceId !== undefined) {
          const updateResult = await serviceClient.updateCompany(
            op.serviceId,
            op.serviceObject,
          );
          if (updateResult.success && updateResult.data !== undefined) {
            const hullInfo = mappingUtil.mapServiceObjectToHullAccount(
              updateResult.data,
            );
            const accountIdent = {
              ...hullInfo.ident,
              id: op.message.account.id,
            };
            await this.hullClient
              .asAccount(accountIdent)
              .traits(hullInfo.attributes);
            this.hullClient
              .asAccount(accountIdent)
              .logger.info("outgoing.account.success", {
                data: op.serviceObject,
                operation: op.operation,
                details: op.notes,
              });
          } else {
            console.error(updateResult.errorDetails);
            const accountIdent = {
              id: op.message.account.id,
              domain: op.message.account.domain,
            };
            this.hullClient
              .asAccount(accountIdent)
              .logger.error("outgoing.account.error", {
                error: updateResult.errorDetails,
              });
          }
        }
      },
    );

    return Promise.resolve(true);
  }

  /**
   * Determines the overall status of the connector.
   *
   * @returns {Promise<ConnectorStatusResponse>} The status response.
   * @memberof SyncAgent
   */
  public async determineConnectorStatus(): Promise<ConnectorStatusResponse> {
    const statusResult: ConnectorStatusResponse = {
      status: "ok",
      messages: [],
    };

    // Perfom checks to verify setup is complete
    if (_.isNil(this.privateSettings.api_key)) {
      statusResult.status = "setupRequired";
      statusResult.messages.push(STATUS_SETUPREQUIRED_NOAPIKEY);
    }

    if (_.isNil(this.privateSettings.domain)) {
      statusResult.status = "setupRequired";
      statusResult.messages.push(STATUS_SETUPREQUIRED_NODOMAIN);
    }

    if (_.isNil(this.privateSettings.account_lookup_attribute_domain)) {
      statusResult.status = "setupRequired";
      statusResult.messages.push(STATUS_SETUPREQUIRED_NOLOOKUPACCTDOMAIN);
    }

    if (_.isNil(this.privateSettings.contact_lookup_attribute_email)) {
      statusResult.status = "setupRequired";
      statusResult.messages.push(STATUS_SETUPREQUIRED_NOLOOKUPCONTACTEMAIL);
    }

    // Perform checks to verify that we can establish a connection to the Freshdesk API
    if (statusResult.status !== "setupRequired") {
      const serviceClient = this.diContainer.resolve<ServiceClient>(
        "serviceClient",
      );

      const agentResult = await serviceClient.getCurrentlyAuthenticatedAgent();
      if (agentResult.success === false) {
        let errorDetails = "No further details from API response.";

        if (agentResult.errorDetails) {
          errorDetails = `Description: '${
            agentResult.errorDetails.description
          }' Errors: ${agentResult.errorDetails.errors
            .map((e) => `${e.message} (code: ${e.code})`)
            .join(" ")}`;
        } else if (agentResult.error) {
          errorDetails = _.isArray(agentResult.error)
            ? agentResult.error.join(" ")
            : agentResult.error;
        }

        statusResult.status = "error";
        statusResult.messages.push(STATUS_ERROR_AUTHN(errorDetails));
      }
    }

    // Perform checks to validate the fields for contacts and companies
    if (statusResult.status === "ok") {
      const validationUtil = this.diContainer.resolve<ValidationUtil>(
        "validationUtil",
      );
      const serviceClient = this.diContainer.resolve<ServiceClient>(
        "serviceClient",
      );
      const contactFieldsResult = await serviceClient.listContactFields();

      if (contactFieldsResult.success === true && contactFieldsResult.data) {
        const contactFieldErrors = validationUtil.validateContactFields(
          contactFieldsResult.data,
        );
        if (contactFieldErrors.length !== 0) {
          statusResult.messages.push(...contactFieldErrors);
          statusResult.status = "warning";
        }
      }

      const companyFieldsResult = await serviceClient.listCompanyFields();

      if (companyFieldsResult.success === true && companyFieldsResult.data) {
        const companyFieldErrors = validationUtil.validateCompanyFields(
          companyFieldsResult.data,
        );
        if (companyFieldErrors.length !== 0) {
          statusResult.messages.push(...companyFieldErrors);
          statusResult.status = "warning";
        }
      }
    }

    return Promise.resolve(statusResult);
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
        this.privateSettings.api_key === null ||
        this.privateSettings.domain === undefined ||
        this.privateSettings.domain === null
      ) {
        throw new Error(ERROR_AUTHN_INCOMPLETE);
      }

      const clnt = this.diContainer.resolve<ServiceClient>("serviceClient");
      const cacheUtil = this.diContainer.resolve<CachingUtil>("cachingUtil");

      switch (objectType) {
        case "company":
          const cacheKeyCompany = CachingUtil.getCacheKey(
            this.hullConnector.id,
            "companyFields",
          );
          const fieldsResultCompany = await cacheUtil.getCachedApiResponse<
            undefined,
            FreshdeskCompanyField[] | undefined
          >(cacheKeyCompany, () => clnt.listCompanyFields(), 600);
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
            }
          }
          break;
        default:
          const cacheKey = CachingUtil.getCacheKey(
            this.hullConnector.id,
            "contactFields",
          );
          const fieldsResult = await cacheUtil.getCachedApiResponse<
            undefined,
            FreshdeskContactField[] | undefined
          >(cacheKey, () => clnt.listContactFields(), 600);
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

  public async fetchContacts(updatedSince?: string): Promise<unknown> {
    const jobDetails = {
      objectType: "contacts",
      jobType: updatedSince ? "incremental" : "full",
    };

    this.hullClient.logger.info("incoming.job.start", jobDetails);

    try {
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
      const mappingUtil = this.diContainer.resolve<MappingUtil>("mappingUtil");

      let hasMore = true;
      let page = 1;
      const perPage = 100;
      let filter = undefined;
      if (updatedSince) {
        filter = `_updated_since=${updatedSince}`;
      }
      while (hasMore === true) {
        const listResult = await serviceClient.listContacts(
          page,
          perPage,
          filter,
        );
        if (listResult.success) {
          const apiData = listResult.data as FreshdeskPagedResult<
            FreshdeskContact
          >;

          this.hullClient.logger.info("incoming.job.progress", {
            ...jobDetails,
            page,
            perPage,
            hasMore: apiData.hasMore,
            count: apiData.results.length,
          });

          hasMore = apiData.hasMore;
          await asyncForEach(apiData.results, async (r: FreshdeskContact) => {
            const hullInfo = mappingUtil.mapServiceObjectToHullUser(r);
            await this.hullClient
              .asUser(hullInfo.ident)
              .traits(hullInfo.attributes);
            this.hullClient
              .asUser(hullInfo.ident)
              .logger.info("incoming.user.success", {
                attributes: hullInfo.attributes,
                ...jobDetails,
              });
          });

          page += 1;
        } else {
          let errorMessage =
            "Failed to complete fetch job due to unknown error.";
          if (_.isArray(listResult.error)) {
            errorMessage = listResult.error.join(" ");
          } else if (typeof listResult.error === "string") {
            errorMessage = listResult.error;
          }

          if (listResult.errorDetails !== undefined) {
            if (listResult.errorDetails.description) {
              errorMessage += ` ${listResult.errorDetails.description}`;
            }

            if (listResult.errorDetails.errors.length !== 0) {
              const concatMsg = listResult.errorDetails.errors
                .map(
                  (e) =>
                    `${e.message} (code: '${e.code}', field: '${e.field}')`,
                )
                .join(" ");
              errorMessage += ` ${concatMsg}`;
            }
          }
          throw new Error(errorMessage.trim());
        }
      }

      this.hullClient.logger.info("incoming.job.success", jobDetails);
    } catch (error) {
      const jobErrorDetails = {
        ...jobDetails,
        error: error.message,
      };

      this.hullClient.logger.error("incoming.job.error", jobErrorDetails);
    }
    return Promise.resolve(true);
  }

  public async fetchCompanies(updatedSince?: string): Promise<unknown> {
    const jobDetails = {
      objectType: "companies",
      jobType: updatedSince ? "incremental" : "full",
    };

    this.hullClient.logger.info("incoming.job.start", jobDetails);

    try {
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
      const mappingUtil = this.diContainer.resolve<MappingUtil>("mappingUtil");
      const filterUtil = this.diContainer.resolve<FilterUtil>("filterUtil");

      let hasMore = true;
      let page = 1;
      const perPage = 100;
      while (hasMore === true) {
        const listResult = await serviceClient.listCompanies(page, perPage);
        if (listResult.success) {
          const apiData = listResult.data as FreshdeskPagedResult<
            FreshdeskCompany
          >;

          this.hullClient.logger.info("incoming.job.progress", {
            ...jobDetails,
            page,
            perPage,
            hasMore: apiData.hasMore,
            count: apiData.results.length,
          });

          hasMore = apiData.hasMore;
          const filteredResults = updatedSince
            ? filterUtil.filterCompaniesUpdatedSince(
                apiData.results,
                updatedSince,
              )
            : apiData.results;
          await asyncForEach(filteredResults, async (r: FreshdeskCompany) => {
            const hullInfo = mappingUtil.mapServiceObjectToHullAccount(r);
            await this.hullClient
              .asAccount(hullInfo.ident)
              .traits(hullInfo.attributes);
            this.hullClient
              .asAccount(hullInfo.ident)
              .logger.info("incoming.account.success", {
                attributes: hullInfo.attributes,
                ...jobDetails,
              });
          });

          page += 1;
        } else {
          let errorMessage =
            "Failed to complete fetch job due to unknown error.";
          if (_.isArray(listResult.error)) {
            errorMessage = listResult.error.join(" ");
          } else if (typeof listResult.error === "string") {
            errorMessage = listResult.error;
          }

          if (listResult.errorDetails !== undefined) {
            if (listResult.errorDetails.description) {
              errorMessage += ` ${listResult.errorDetails.description}`;
            }

            if (listResult.errorDetails.errors.length !== 0) {
              const concatMsg = listResult.errorDetails.errors
                .map(
                  (e) =>
                    `${e.message} (code: '${e.code}', field: '${e.field}')`,
                )
                .join(" ");
              errorMessage += ` ${concatMsg}`;
            }
          }
          throw new Error(errorMessage.trim());
        }
      }

      this.hullClient.logger.info("incoming.job.success", jobDetails);
    } catch (error) {
      const jobErrorDetails = {
        ...jobDetails,
        error: error.message,
      };

      this.hullClient.logger.error("incoming.job.error", jobErrorDetails);
    }
    return Promise.resolve(true);
  }

  public async fetchTickets(updatedSince?: string): Promise<unknown> {
    const jobDetails = {
      objectType: "tickets",
      jobType: updatedSince ? "incremental" : "full",
    };

    this.hullClient.logger.info("incoming.job.start", jobDetails);
    try {
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
      const mappingUtil = this.diContainer.resolve<MappingUtil>("mappingUtil");

      let hasMore = true;
      let page = 1;
      const perPage = 100;

      while (hasMore === true) {
        const listResult = await serviceClient.listTickets(
          page,
          perPage,
          "updated_at",
          "desc",
          ["description", "requester", "stats"],
          updatedSince,
        );
        if (listResult.success) {
          const apiData = listResult.data as FreshdeskPagedResult<
            FreshdeskTicket
          >;

          this.hullClient.logger.info("incoming.job.progress", {
            ...jobDetails,
            page,
            perPage,
            hasMore: apiData.hasMore,
            count: apiData.results.length,
          });

          hasMore = apiData.hasMore;
          await asyncForEach(apiData.results, async (r: FreshdeskTicket) => {
            const hullInfo = mappingUtil.mapTicketToHullEvent(r);

            if (
              !_.isNil(hullInfo.eventName) &&
              !_.isNil(hullInfo.properties) &&
              !_.isNil(hullInfo.context) &&
              Object.keys(hullInfo.ident).length !== 0
            ) {
              await this.hullClient
                .asUser(hullInfo.ident)
                .track(
                  hullInfo.eventName,
                  hullInfo.properties,
                  hullInfo.context,
                );
              this.hullClient
                .asUser(hullInfo.ident)
                .logger.info("incoming.event.success", {
                  properties: hullInfo.properties,
                  context: hullInfo.context,
                  ...jobDetails,
                });
            }
          });

          page += 1;
        } else {
          let errorMessage =
            "Failed to complete fetch job due to unknown error.";
          if (_.isArray(listResult.error)) {
            errorMessage = listResult.error.join(" ");
          } else if (typeof listResult.error === "string") {
            errorMessage = listResult.error;
          }

          if (listResult.errorDetails !== undefined) {
            if (listResult.errorDetails.description) {
              errorMessage += ` ${listResult.errorDetails.description}`;
            }

            if (listResult.errorDetails.errors.length !== 0) {
              const concatMsg = listResult.errorDetails.errors
                .map(
                  (e) =>
                    `${e.message} (code: '${e.code}', field: '${e.field}')`,
                )
                .join(" ");
              errorMessage += ` ${concatMsg}`;
            }
          }
          throw new Error(errorMessage.trim());
        }
      }

      this.hullClient.logger.info("incoming.job.success", jobDetails);
    } catch (error) {
      const jobErrorDetails = {
        ...jobDetails,
        error: error.message,
      };

      this.hullClient.logger.error("incoming.job.error", jobErrorDetails);
    }
    return Promise.resolve(true);
  }
}

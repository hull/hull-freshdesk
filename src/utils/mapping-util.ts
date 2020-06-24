import { PrivateSettings } from "../types/private-settings";
import { Logger } from "winston";
import {
  OutgoingOperationEnvelope,
  FreshdeskContactCreateUpdate,
  FreshdeskContactField,
  FreshdeskContact,
  IncomingData,
  FreshdeskCompanyField,
  FreshdeskCompanyCreateOrUpdate,
  FreshdeskCompany,
  FreshdeskTicket,
} from "../core/service-objects";
import IHullUserUpdateMessage from "../types/user-update-message";
import _ from "lodash";
import { IHullUserClaims, IHullUserAttributes } from "../types/user";
import IHullAccountUpdateMessage from "../types/account-update-message";
import {
  VALIDATION_SKIP_ACCOUNT_NODOMAINLOOKUP,
  VALIDATION_WARN_ACCOUNT_INVALIDMAPPINGOUT,
  VALIDATION_SKIP_ACCOUNT_NONAMEMAPPING,
} from "../core/messages";
import { IHullAccountClaims, IHullAccountAttributes } from "../types/account";

export class MappingUtil {
  readonly privateSettings: PrivateSettings;
  readonly logger: Logger;
  readonly contactFields: FreshdeskContactField[];
  readonly companyFields: FreshdeskCompanyField[];

  constructor(options: any) {
    this.privateSettings = options.privateSettings;
    this.logger = options.logger;
    this.contactFields = options.contactFields;
    this.companyFields = options.companyFields;

    console.log(this.privateSettings);
  }

  public mapHullUserToServiceObject(
    envelope: OutgoingOperationEnvelope<
      IHullUserUpdateMessage,
      FreshdeskContactCreateUpdate
    >,
  ): OutgoingOperationEnvelope<
    IHullUserUpdateMessage,
    FreshdeskContactCreateUpdate
  > {
    const result: OutgoingOperationEnvelope<
      IHullUserUpdateMessage,
      FreshdeskContactCreateUpdate
    > = {
      ...envelope,
    };

    const serviceObject = {};

    const hullObject = {
      ...envelope.message.user,
      account: envelope.message.account,
    };

    this.privateSettings.contact_attributes_outbound.forEach((m) => {
      if (!_.isNil(m.service) && !_.isNil(m.hull)) {
        const fieldDef = _.find(this.contactFields, { name: m.service });
        if (fieldDef !== undefined) {
          if (fieldDef.default === true) {
            _.set(
              serviceObject,
              m.service,
              _.get(hullObject, m.hull, undefined),
            );
          } else {
            _.set(
              serviceObject,
              `custom_fields.${m.service}`,
              _.get(hullObject, m.hull, undefined),
            );
          }
        } else {
          if (result.notes === undefined) {
            result.notes = [
              `Invalid mapping to contact field '${m.service}' has been ignored.`,
            ];
          } else {
            result.notes.push(
              `Invalid mapping to contact field '${m.service}' has been ignored.`,
            );
          }
        }
      }
    });

    if (this.privateSettings.contact_lookup_attribute_email !== undefined) {
      _.set(
        serviceObject,
        "email",
        _.get(
          hullObject,
          this.privateSettings.contact_lookup_attribute_email,
          undefined,
        ),
      );
    } else {
      result.operation = "skip";
      if (result.notes === undefined) {
        result.notes = [
          "No email lookup attribute specified. Cannot synchronize contact.",
        ];
      } else {
        result.notes.push(
          "No email lookup attribute specified. Cannot synchronize contact.",
        );
      }
    }

    _.set(result, "serviceObject", serviceObject);

    return result;
  }

  public mapServiceObjectToHullUser(
    data: FreshdeskContact,
  ): IncomingData<IHullUserClaims, IHullUserAttributes> {
    const hullData: IncomingData<IHullUserClaims, IHullUserAttributes> = {
      objectType: "user",
      ident: {},
      attributes: {},
    };

    this.privateSettings.contact_attributes_inbound.forEach((m) => {
      if (!_.isNil(m.hull) && !_.isNil(m.service)) {
        const fieldDef = _.find(this.contactFields, { name: m.service });
        if (fieldDef !== undefined) {
          const hullAttrib = m.hull.replace("traits_", "");
          if (fieldDef.default === true) {
            _.set(
              hullData.attributes,
              hullAttrib,
              _.get(data, m.service, undefined),
            );
          } else {
            _.set(
              hullData.attributes,
              hullAttrib,
              _.get(data, `custom_fields.${m.service}`, undefined),
            );
          }
        }
      }
    });

    if (data.email !== undefined) {
      _.set(hullData, "ident.email", data.email);
      _.set(hullData.attributes, "freshdesk/email", data.email);
    }

    hullData.ident.anonymous_id = `freshdesk:${data.id}`;
    _.set(hullData.attributes, "freshdesk/id", {
      value: data.id,
      operation: "setIfNull",
    });

    return hullData;
  }

  public mapHullAccountToServiceObject(
    envelope: OutgoingOperationEnvelope<
      IHullAccountUpdateMessage,
      FreshdeskCompanyCreateOrUpdate
    >,
  ): OutgoingOperationEnvelope<
    IHullAccountUpdateMessage,
    FreshdeskCompanyCreateOrUpdate
  > {
    const result: OutgoingOperationEnvelope<
      IHullAccountUpdateMessage,
      FreshdeskCompanyCreateOrUpdate
    > = {
      ...envelope,
    };

    const serviceObject = {};

    const hullObject = {
      ...envelope.message.account,
    };

    this.privateSettings.account_attributes_outbound.forEach((m) => {
      if (!_.isNil(m.service) && !_.isNil(m.hull)) {
        const fieldDef = _.find(this.companyFields, { name: m.service });
        if (fieldDef !== undefined) {
          if (fieldDef.default === true) {
            _.set(
              serviceObject,
              m.service,
              _.get(hullObject, m.hull, undefined),
            );
          } else {
            _.set(
              serviceObject,
              `custom_fields.${m.service}`,
              _.get(hullObject, m.hull, undefined),
            );
          }
        } else {
          if (result.notes === undefined) {
            result.notes = [
              VALIDATION_WARN_ACCOUNT_INVALIDMAPPINGOUT(m.service),
            ];
          } else {
            result.notes.push(
              VALIDATION_WARN_ACCOUNT_INVALIDMAPPINGOUT(m.service),
            );
          }
        }
      }
    });

    if (this.privateSettings.account_lookup_attribute_domain !== undefined) {
      _.set(serviceObject, "domains", [
        _.get(
          hullObject,
          this.privateSettings.account_lookup_attribute_domain,
          undefined,
        ),
      ]);
    } else {
      result.operation = "skip";
      if (result.notes === undefined) {
        result.notes = [VALIDATION_SKIP_ACCOUNT_NODOMAINLOOKUP];
      } else {
        result.notes.push(VALIDATION_SKIP_ACCOUNT_NODOMAINLOOKUP);
      }
    }

    if (_.get(serviceObject, "name", undefined) === undefined) {
      result.operation = "skip";
      if (result.notes === undefined) {
        result.notes = [VALIDATION_SKIP_ACCOUNT_NONAMEMAPPING];
      } else {
        result.notes.push(VALIDATION_SKIP_ACCOUNT_NONAMEMAPPING);
      }
    }
    _.set(result, "serviceObject", serviceObject);

    return result;
  }

  public mapServiceObjectToHullAccount(
    data: FreshdeskCompany,
  ): IncomingData<IHullAccountClaims, IHullAccountAttributes> {
    const hullData: IncomingData<IHullAccountClaims, IHullAccountAttributes> = {
      objectType: "account",
      ident: {},
      attributes: {},
    };

    this.privateSettings.account_attributes_inbound.forEach((m) => {
      if (!_.isNil(m.hull) && !_.isNil(m.service)) {
        const fieldDef = _.find(this.companyFields, { name: m.service });
        if (fieldDef !== undefined) {
          const hullAttrib = m.hull;
          if (fieldDef.default === true) {
            _.set(
              hullData.attributes,
              hullAttrib,
              _.get(data, m.service, undefined),
            );
          } else {
            _.set(
              hullData.attributes,
              hullAttrib,
              _.get(data, `custom_fields.${m.service}`, undefined),
            );
          }
        }
      }
    });

    if (
      data.domains !== undefined &&
      data.domains !== null &&
      data.domains.length !== 0
    ) {
      _.set(hullData, "ident.domain", data.domains[0]);
      _.set(hullData.attributes, "freshdesk/domains", data.domains);
    }

    hullData.ident.anonymous_id = `freshdesk:${data.id}`;
    _.set(hullData.attributes, "freshdesk/id", {
      value: data.id,
      operation: "setIfNull",
    });

    return hullData;
  }

  public mapTicketToHullEvent(
    data: FreshdeskTicket,
  ): IncomingData<IHullUserClaims, IHullUserAttributes> {
    const hullData: IncomingData<IHullUserClaims, IHullUserAttributes> = {
      objectType: "event",
      ident: {},
      attributes: {},
      properties: {},
      context: {
        event_id: `fd-${data.id}-${data.updated_at}`,
        ip: 0,
        source: "freshdesk",
      },
      eventName: `Ticket ${
        data.created_at === data.updated_at ? "created" : "updated"
      }`,
    };

    if (!_.isNil(data.requester_id)) {
      hullData.ident.anonymous_id = `freshdesk:${data.requester_id}`;
    }

    if (!_.isNil(_.get(data, "requester.email", undefined))) {
      _.set(hullData, "ident.email", _.get(data, "requester.email"));
    }

    const propsToProcess = _.omit(data, ["attachments", "requester"]);
    _.forIn(propsToProcess, (v, k) => {
      if (k === "custom_fields" || k === "stats") {
        _.forIn(v, (vn, kn) => {
          _.set(hullData, `properties.${k}__${_.snakeCase(kn)}`, vn);
        });
      } else {
        _.set(hullData, `properties.${k}`, v);
      }
    });

    return hullData;
  }
}

import { PrivateSettings } from "../types/private-settings";
import { Logger } from "winston";
import {
  OutgoingOperationEnvelope,
  FreshdeskContactCreateUpdate,
  FreshdeskContactField,
  FreshdeskContact,
  IncomingData,
} from "../core/service-objects";
import IHullUserUpdateMessage from "../types/user-update-message";
import _ from "lodash";
import { IHullUserClaims, IHullUserAttributes } from "../types/user";

export class MappingUtil {
  readonly privateSettings: PrivateSettings;
  readonly logger: Logger;
  readonly contactFields: FreshdeskContactField[];

  constructor(options: any) {
    this.privateSettings = options.privateSettings;
    this.logger = options.logger;
    this.contactFields = options.contactFields;
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
}

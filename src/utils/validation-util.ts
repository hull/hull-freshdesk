import { PrivateSettings } from "../types/private-settings";
import { Logger } from "winston";
import {
  FreshdeskContactField,
  FreshdeskCompanyField,
} from "../core/service-objects";
import { isNil } from "lodash";
import { STATUS_WARN_FIELDDOESNTEXIST } from "../core/messages";

export class ValidationUtil {
  readonly privateSettings: PrivateSettings;
  readonly logger: Logger;

  constructor(options: any) {
    this.privateSettings = options.privateSettings;
    this.logger = options.logger;
  }

  public validateContactFields(fields: FreshdeskContactField[]): string[] {
    const errorMessages: string[] = [];
    const fieldNames = fields.map((f) => f.name);

    // Validate inbound fields
    if (
      this.privateSettings.contact_attributes_inbound &&
      this.privateSettings.contact_attributes_inbound.length > 0
    ) {
      this.privateSettings.contact_attributes_inbound.forEach((m) => {
        if (!isNil(m.service) && !fieldNames.includes(m.service)) {
          errorMessages.push(
            STATUS_WARN_FIELDDOESNTEXIST(
              m.service,
              "Contacts > Incoming Fields",
            ),
          );
        }
      });
    }

    // Validate outbound fields
    if (
      this.privateSettings.contact_attributes_outbound &&
      this.privateSettings.contact_attributes_outbound.length > 0
    ) {
      this.privateSettings.contact_attributes_outbound.forEach((m) => {
        if (!isNil(m.service) && !fieldNames.includes(m.service)) {
          errorMessages.push(
            STATUS_WARN_FIELDDOESNTEXIST(
              m.service,
              "Contacts > Outgoing Attributes",
            ),
          );
        }
      });
    }

    return errorMessages;
  }

  public validateCompanyFields(fields: FreshdeskCompanyField[]): string[] {
    const errorMessages: string[] = [];
    const fieldNames = fields.map((f) => f.name);

    // Validate inbound fields
    if (
      this.privateSettings.account_attributes_inbound &&
      this.privateSettings.account_attributes_inbound.length > 0
    ) {
      this.privateSettings.account_attributes_inbound.forEach((m) => {
        if (!isNil(m.service) && !fieldNames.includes(m.service)) {
          errorMessages.push(
            STATUS_WARN_FIELDDOESNTEXIST(
              m.service,
              "Companies > Incoming Fields",
            ),
          );
        }
      });
    }

    // Validate outbound fields
    if (
      this.privateSettings.account_attributes_outbound &&
      this.privateSettings.account_attributes_outbound.length > 0
    ) {
      this.privateSettings.account_attributes_outbound.forEach((m) => {
        if (!isNil(m.service) && !fieldNames.includes(m.service)) {
          errorMessages.push(
            STATUS_WARN_FIELDDOESNTEXIST(
              m.service,
              "Companies > Outgoing Attributes",
            ),
          );
        }
      });
    }

    return errorMessages;
  }
}

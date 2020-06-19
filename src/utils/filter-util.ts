import { PrivateSettings } from "../types/private-settings";
import { Logger } from "winston";
import IHullUserUpdateMessage from "../types/user-update-message";
import {
  OutgoingOperationEnvelopesFiltered,
  FreshdeskContactCreateUpdate,
  FreshdeskCompanyCreateOrUpdate,
} from "../core/service-objects";
import IHullSegment from "../types/hull-segment";
import _ from "lodash";
import { VALIDATION_SKIP_HULLOBJECT_NOTINANYSEGMENT } from "../core/messages";
import IHullAccountUpdateMessage from "../types/account-update-message";

export class FilterUtil {
  readonly privateSettings: PrivateSettings;
  readonly logger: Logger;

  constructor(options: any) {
    this.privateSettings = options.privateSettings;
    this.logger = options.logger;
  }

  public filterUserMessagesInitial(
    messages: IHullUserUpdateMessage[],
  ): OutgoingOperationEnvelopesFiltered<
    IHullUserUpdateMessage,
    FreshdeskContactCreateUpdate
  > {
    const result: OutgoingOperationEnvelopesFiltered<
      IHullUserUpdateMessage,
      FreshdeskContactCreateUpdate
    > = {
      inserts: [],
      updates: [],
      skips: [],
    };

    messages.forEach((msg) => {
      if (
        !FilterUtil.isInAnySegment(
          msg.segments,
          this.privateSettings.contact_synchronized_segments,
        )
      ) {
        result.skips.push({
          message: msg,
          operation: "skip",
          notes: [VALIDATION_SKIP_HULLOBJECT_NOTINANYSEGMENT("user")],
        });
      } else {
        if (_.get(msg, "user.traits_freshdesk/id", undefined) === undefined) {
          result.inserts.push({
            message: msg,
            operation: "insert",
          });
        } else {
          result.updates.push({
            message: msg,
            operation: "update",
          });
        }
      }
    });

    return result;
  }

  public filterAccountMessagesInitial(
    messages: IHullAccountUpdateMessage[],
  ): OutgoingOperationEnvelopesFiltered<
    IHullAccountUpdateMessage,
    FreshdeskCompanyCreateOrUpdate
  > {
    const result: OutgoingOperationEnvelopesFiltered<
      IHullAccountUpdateMessage,
      FreshdeskCompanyCreateOrUpdate
    > = {
      inserts: [],
      updates: [],
      skips: [],
    };

    messages.forEach((msg) => {
      if (
        !FilterUtil.isInAnySegment(
          msg.account_segments,
          this.privateSettings.account_synchronized_segments,
        )
      ) {
        result.skips.push({
          message: msg,
          operation: "skip",
          notes: [VALIDATION_SKIP_HULLOBJECT_NOTINANYSEGMENT("account")],
        });
      } else {
        if (_.get(msg, "account.freshdesk/id", undefined) === undefined) {
          result.inserts.push({
            message: msg,
            operation: "insert",
          });
        } else {
          result.updates.push({
            message: msg,
            operation: "update",
          });
        }
      }
    });

    return result;
  }

  private static isInAnySegment(
    actualSegments: IHullSegment[],
    whitelistedSegments: string[],
  ): boolean {
    const actualIds = actualSegments.map((s) => s.id);
    if (_.intersection(actualIds, whitelistedSegments).length === 0) {
      return false;
    }

    return true;
  }
}

import { PrivateSettings } from "../types/private-settings";
import { Logger } from "winston";
import IHullUserUpdateMessage from "../types/user-update-message";
import {
  OutgoingOperationEnvelopesFiltered,
  FreshdeskContactCreateUpdate,
  FreshdeskCompanyCreateOrUpdate,
  FreshdeskContact,
  FreshdeskCompany,
} from "../core/service-objects";
import IHullSegment from "../types/hull-segment";
import _ from "lodash";
import { VALIDATION_SKIP_HULLOBJECT_NOTINANYSEGMENT } from "../core/messages";
import IHullAccountUpdateMessage from "../types/account-update-message";
import { DateTime } from "luxon";

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
            serviceId: _.get(msg, "user.traits_freshdesk/id"),
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
            serviceId: _.get(msg, "account.freshdesk/id"),
          });
        }
      }
    });

    return result;
  }

  public filterUserEnvelopesToReevaluateForUpdate(
    filteredResult: OutgoingOperationEnvelopesFiltered<
      IHullUserUpdateMessage,
      FreshdeskContactCreateUpdate
    >,
    queriedContacts: FreshdeskContact[],
  ): OutgoingOperationEnvelopesFiltered<
    IHullUserUpdateMessage,
    FreshdeskContactCreateUpdate
  > {
    const result: OutgoingOperationEnvelopesFiltered<
      IHullUserUpdateMessage,
      FreshdeskContactCreateUpdate
    > = {
      inserts: [],
      updates: filteredResult.updates,
      skips: filteredResult.skips,
    };
    if (filteredResult.inserts && filteredResult.inserts.length !== 0) {
      filteredResult.inserts.forEach((envelope) => {
        if (
          !_.isNil(envelope.serviceObject) &&
          !_.isNil(envelope.serviceObject.email)
        ) {
          const matchingContact = _.find(queriedContacts, (c) => {
            return (
              c.email === (envelope.serviceObject as FreshdeskContact).email
            );
          });

          if (matchingContact === undefined) {
            result.inserts.push({ ...envelope });
          } else {
            result.updates.push({
              ...envelope,
              operation: "update",
              serviceId: matchingContact.id,
            });
          }
        }
      });
    }

    return result;
  }

  public filterAccountEnvelopesToReevaluateForUpdate(
    filteredResult: OutgoingOperationEnvelopesFiltered<
      IHullAccountUpdateMessage,
      FreshdeskCompanyCreateOrUpdate
    >,
    queriedCompanies: FreshdeskCompany[],
  ): OutgoingOperationEnvelopesFiltered<
    IHullAccountUpdateMessage,
    FreshdeskCompanyCreateOrUpdate
  > {
    const result: OutgoingOperationEnvelopesFiltered<
      IHullAccountUpdateMessage,
      FreshdeskCompanyCreateOrUpdate
    > = {
      inserts: [],
      updates: filteredResult.updates,
      skips: filteredResult.skips,
    };
    if (filteredResult.inserts && filteredResult.inserts.length !== 0) {
      filteredResult.inserts.forEach((envelope) => {
        if (
          !_.isNil(envelope.serviceObject) &&
          !_.isNil(envelope.serviceObject.domains)
        ) {
          const matchingCompany = _.find(queriedCompanies, (c) => {
            return (
              !_.isNil(c.domains) &&
              _.intersection(
                c.domains,
                (envelope.serviceObject as FreshdeskCompanyCreateOrUpdate)
                  .domains as string[],
              ).length !== 0
            );
          });

          if (matchingCompany === undefined) {
            result.inserts.push({ ...envelope });
          } else {
            result.updates.push({
              ...envelope,
              operation: "update",
              serviceId: matchingCompany.id,
            });
          }
        }
      });
    }

    return result;
  }

  public filterCompaniesUpdatedSince(
    companies: FreshdeskCompany[],
    updatedSince: string,
  ): FreshdeskCompany[] {
    const filteredCompanies: FreshdeskCompany[] = [];
    this.logger.debug(
      `Started filtering ${companies.length} companies for updates since ${updatedSince}...`,
    );
    const threshold = DateTime.fromISO(updatedSince);

    companies.forEach((c: FreshdeskCompany) => {
      if (DateTime.fromISO(c.updated_at) > threshold) {
        this.logger.debug(
          `Company with id '${c.id}' has been updated since ${updatedSince}. Adding to filtered output. (updated_at: ${c.updated_at})`,
        );
        filteredCompanies.push(c);
      } else {
        this.logger.debug(
          `Company with id '${c.id}' has not been updated since ${updatedSince}. (updated_at: ${c.updated_at})`,
        );
      }
    });

    this.logger.debug(
      `Completed filtering ${companies.length} companies for updates since ${updatedSince}, yielded ${filteredCompanies.length} result(s).`,
    );
    return filteredCompanies;
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

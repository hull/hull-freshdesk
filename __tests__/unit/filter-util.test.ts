import { FilterUtil } from "../../src/utils/filter-util";
import UserUpdateNotification from "../_data/hull__user_update_message.json";
import AccountUpdateNotification from "../_data/hull__account_update_message.json";
import {
  OutgoingOperationEnvelopesFiltered,
  FreshdeskContactCreateUpdate,
  FreshdeskCompanyCreateOrUpdate,
} from "../../src/core/service-objects";
import IHullUserUpdateMessage from "../../src/types/user-update-message";
import IHullAccountUpdateMessage from "../../src/types/account-update-message";
import _ from "lodash";
import { VALIDATION_SKIP_HULLOBJECT_NOTINANYSEGMENT } from "../../src/core/messages";
import ApiResponseListAllCompanies from "../_data/api__list_all_companies.json";
import { DateTime } from "luxon";

describe("FilterUtil", () => {
  describe("constructor()", () => {
    it("should initialize privateSettings, logger and field definitions", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: console,
      };

      const util = new FilterUtil(options);
      expect(util.logger).toBeDefined();
      expect(util.privateSettings).toEqual(options.privateSettings);
    });
  });

  describe("filterUserMessagesInitial()", () => {
    it("should mark all messages as skips which do not match the whitelisted user segments", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: ["nomatch"],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: console,
      };

      const hullNotification = {
        ...UserUpdateNotification,
      };

      const expected: OutgoingOperationEnvelopesFiltered<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        inserts: [],
        updates: [],
        skips: _.map(hullNotification.messages, (msg) => {
          return {
            message: msg,
            operation: "skip",
            notes: [VALIDATION_SKIP_HULLOBJECT_NOTINANYSEGMENT("user")],
          };
        }),
      };

      const util = new FilterUtil(options);
      const actual = util.filterUserMessagesInitial(hullNotification.messages);

      expect(actual).toEqual(expected);
    });

    it("should mark all messages as inserts which do match the whitelisted user segments", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: ["test1234"],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: console,
      };

      const hullNotification = {
        ...UserUpdateNotification,
      };

      _.forEach(hullNotification.messages, (msg, i) => {
        const { segments } = msg;
        const newSegment = {
          id: "test1234",
          updated_at: "2019-12-29T15:38:59Z",
          created_at: "2019-12-29T15:38:59Z",
          name: "Freshdesk Contacts",
          type: "users_segment",
          stats: {},
        };
        _.set(
          hullNotification.messages[i],
          "segments",
          _.concat(segments, newSegment),
        );
      });

      const expected: OutgoingOperationEnvelopesFiltered<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        inserts: _.map(hullNotification.messages, (msg) => {
          return {
            message: msg,
            operation: "insert",
          };
        }),
        updates: [],
        skips: [],
      };

      const util = new FilterUtil(options);
      const actual = util.filterUserMessagesInitial(hullNotification.messages);

      expect(actual).toEqual(expected);
    });

    it("should mark all messages as updates which do match the whitelisted user segments and have a 'freshdesk/id' attribute", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: ["test1234"],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: console,
      };

      const hullNotification = {
        ...UserUpdateNotification,
      };

      _.forEach(hullNotification.messages, (msg, i) => {
        const { segments } = msg;
        const newSegment = {
          id: "test1234",
          updated_at: "2019-12-29T15:38:59Z",
          created_at: "2019-12-29T15:38:59Z",
          name: "Freshdesk Contacts",
          type: "users_segment",
          stats: {},
        };
        _.set(
          hullNotification.messages[i],
          "segments",
          _.concat(segments, newSegment),
        );

        _.set(hullNotification.messages[i].user, "traits_freshdesk/id", 432);
      });

      const expected: OutgoingOperationEnvelopesFiltered<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        inserts: [],
        updates: _.map(hullNotification.messages, (msg) => {
          return {
            message: msg,
            operation: "update",
            serviceId: 432,
          };
        }),
        skips: [],
      };

      const util = new FilterUtil(options);
      const actual = util.filterUserMessagesInitial(hullNotification.messages);

      expect(actual).toEqual(expected);
    });
  });

  describe("filterAccountMessagesInitial()", () => {
    it("should mark all messages as skips which do not match the whitelisted account segments", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: ["nomatch"],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: console,
      };

      const hullNotification = {
        ...AccountUpdateNotification,
      };

      const expected: OutgoingOperationEnvelopesFiltered<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        inserts: [],
        updates: [],
        skips: _.map(hullNotification.messages, (msg) => {
          return {
            message: msg,
            operation: "skip",
            notes: [VALIDATION_SKIP_HULLOBJECT_NOTINANYSEGMENT("account")],
          };
        }),
      };

      const util = new FilterUtil(options);
      const actual = util.filterAccountMessagesInitial(
        hullNotification.messages,
      );

      expect(actual).toEqual(expected);
    });

    it("should mark all messages as inserts which do match the whitelisted account segments", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: ["test1234"],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: console,
      };

      const hullNotification = {
        ...AccountUpdateNotification,
      };

      _.forEach(hullNotification.messages, (msg, i) => {
        const { account_segments } = msg;
        const newSegment = {
          id: "test1234",
          updated_at: "2019-12-29T15:38:59Z",
          created_at: "2019-12-29T15:38:59Z",
          name: "Freshdesk Companies",
          type: "accounts_segment",
          stats: {},
        };
        _.set(
          hullNotification.messages[i],
          "account_segments",
          _.concat(account_segments, newSegment),
        );
      });

      const expected: OutgoingOperationEnvelopesFiltered<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        inserts: _.map(hullNotification.messages, (msg) => {
          return {
            message: msg,
            operation: "insert",
          };
        }),
        updates: [],
        skips: [],
      };

      const util = new FilterUtil(options);
      const actual = util.filterAccountMessagesInitial(
        hullNotification.messages,
      );

      expect(actual).toEqual(expected);
    });

    it("should mark all messages as updates which do match the whitelisted account segments and have a 'freshdesk/id' attribute", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: ["test1234"],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: console,
      };

      const hullNotification = {
        ...AccountUpdateNotification,
      };

      _.forEach(hullNotification.messages, (msg, i) => {
        const { account_segments } = msg;
        const newSegment = {
          id: "test1234",
          updated_at: "2019-12-29T15:38:59Z",
          created_at: "2019-12-29T15:38:59Z",
          name: "Freshdesk Companies",
          type: "accounts_segment",
          stats: {},
        };
        _.set(
          hullNotification.messages[i],
          "account_segments",
          _.concat(account_segments, newSegment),
        );

        _.set(hullNotification.messages[i].account, "freshdesk/id", 999);
      });

      const expected: OutgoingOperationEnvelopesFiltered<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        inserts: [],
        updates: _.map(hullNotification.messages, (msg) => {
          return {
            message: msg,
            operation: "update",
            serviceId: 999,
          };
        }),
        skips: [],
      };

      const util = new FilterUtil(options);
      const actual = util.filterAccountMessagesInitial(
        hullNotification.messages,
      );

      expect(actual).toEqual(expected);
    });
  });

  describe("filterUserEnvelopesToReevaluateForUpdate()", () => {
    it("should not change anything in the filtered results if no contacts have been found", () => {
      const hullNotification = {
        ...UserUpdateNotification,
      };

      const initialResult: OutgoingOperationEnvelopesFiltered<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        inserts: _.map(hullNotification.messages, (msg) => {
          return {
            message: msg,
            operation: "insert",
            serviceObject: {
              email: msg.user.email,
              name: msg.user.name,
            },
          };
        }),
        updates: [],
        skips: [],
      };

      const options = {
        privateSettings: {
          contact_synchronized_segments: ["test1234"],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
      };

      const util = new FilterUtil(options);
      const actual = util.filterUserEnvelopesToReevaluateForUpdate(
        initialResult,
        [],
      );
      expect(actual).toEqual(initialResult);
    });

    it("should add envelopes with insert operation to update if matching contact has been found", () => {
      const hullNotification = {
        ...UserUpdateNotification,
      };

      const initialResult: OutgoingOperationEnvelopesFiltered<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        inserts: _.map(hullNotification.messages, (msg) => {
          return {
            message: msg,
            operation: "insert",
            serviceObject: {
              email: msg.user.email,
              name: msg.user.name,
            },
          };
        }),
        updates: [],
        skips: [],
      };

      const options = {
        privateSettings: {
          contact_synchronized_segments: ["test1234"],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
      };

      const util = new FilterUtil(options);
      const actual = util.filterUserEnvelopesToReevaluateForUpdate(
        initialResult,
        _.map(hullNotification.messages, (msg) => {
          return {
            id: 1,
            email: msg.user.email,
            name: msg.user.name,
            active: true,
            created_at: "2015-08-28T09:08:16Z",
            updated_at: "2015-08-28T09:08:16Z",
          };
        }),
      );

      const expected: OutgoingOperationEnvelopesFiltered<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        inserts: [],
        updates: _.map(hullNotification.messages, (msg) => {
          return {
            message: msg,
            operation: "update",
            serviceObject: {
              email: msg.user.email,
              name: msg.user.name,
            },
            serviceId: 1,
          };
        }),
        skips: [],
      };

      expect(actual).toEqual(expected);
    });

    it("should not fail if no inserts are present in the initial result", () => {
      const initialResult: OutgoingOperationEnvelopesFiltered<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        inserts: [],
        updates: [],
        skips: [],
      };

      const options = {
        privateSettings: {
          contact_synchronized_segments: ["test1234"],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
      };

      const util = new FilterUtil(options);
      const actual = util.filterUserEnvelopesToReevaluateForUpdate(
        initialResult,
        [],
      );
      expect(actual).toEqual(initialResult);
    });

    it("should not fail if no serviceObject is present in an envelope but remove it from inserts", () => {
      const hullNotification = {
        ...UserUpdateNotification,
      };

      const initialResult: OutgoingOperationEnvelopesFiltered<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        inserts: _.map(hullNotification.messages, (msg) => {
          return {
            message: msg,
            operation: "insert",
          };
        }),
        updates: [],
        skips: [],
      };

      const options = {
        privateSettings: {
          contact_synchronized_segments: ["test1234"],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
      };

      const util = new FilterUtil(options);
      const actual = util.filterUserEnvelopesToReevaluateForUpdate(
        initialResult,
        [],
      );
      expect(actual).toEqual({
        inserts: [],
        updates: [],
        skips: [],
      });
    });
  });

  describe("filterAccountEnvelopesToReevaluateForUpdate()", () => {
    it("should not change anything in the filtered results if no companies have been found", () => {
      const hullNotification = {
        ...AccountUpdateNotification,
      };

      const initialResult: OutgoingOperationEnvelopesFiltered<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        inserts: _.map(hullNotification.messages, (msg) => {
          return {
            message: msg,
            operation: "insert",
            serviceObject: {
              domains: [msg.account.domain],
              name: msg.account.name,
            },
          };
        }),
        updates: [],
        skips: [],
      };

      const options = {
        privateSettings: {
          contact_synchronized_segments: ["test1234"],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
      };

      const util = new FilterUtil(options);
      const actual = util.filterAccountEnvelopesToReevaluateForUpdate(
        initialResult,
        [],
      );
      expect(actual).toEqual(initialResult);
    });

    it("should add envelopes with insert operation to update if matching company has been found", () => {
      const hullNotification = {
        ...AccountUpdateNotification,
      };

      const initialResult: OutgoingOperationEnvelopesFiltered<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        inserts: _.map(hullNotification.messages, (msg) => {
          return {
            message: msg,
            operation: "insert",
            serviceObject: {
              domains: [msg.account.domain],
              name: msg.account.name,
            },
          };
        }),
        updates: [],
        skips: [],
      };

      const options = {
        privateSettings: {
          contact_synchronized_segments: ["test1234"],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
      };

      const util = new FilterUtil(options);
      const actual = util.filterAccountEnvelopesToReevaluateForUpdate(
        initialResult,
        _.map(hullNotification.messages, (msg) => {
          return {
            id: 1,
            domains: [msg.account.domain],
            name: msg.account.name,
            active: true,
            created_at: "2015-08-28T09:08:16Z",
            updated_at: "2015-08-28T09:08:16Z",
          };
        }),
      );

      const expected: OutgoingOperationEnvelopesFiltered<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        inserts: [],
        updates: _.map(hullNotification.messages, (msg) => {
          return {
            message: msg,
            operation: "update",
            serviceObject: {
              domains: [msg.account.domain],
              name: msg.account.name,
            },
            serviceId: 1,
          };
        }),
        skips: [],
      };

      expect(actual).toEqual(expected);
    });

    it("should not fail if no inserts are present in the initial result", () => {
      const initialResult: OutgoingOperationEnvelopesFiltered<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        inserts: [],
        updates: [],
        skips: [],
      };

      const options = {
        privateSettings: {
          contact_synchronized_segments: ["test1234"],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
      };

      const util = new FilterUtil(options);
      const actual = util.filterAccountEnvelopesToReevaluateForUpdate(
        initialResult,
        [],
      );
      expect(actual).toEqual(initialResult);
    });

    it("should not fail if no serviceObject is present in an envelope but remove it from inserts", () => {
      const hullNotification = {
        ...AccountUpdateNotification,
      };

      const initialResult: OutgoingOperationEnvelopesFiltered<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        inserts: _.map(hullNotification.messages, (msg) => {
          return {
            message: msg,
            operation: "insert",
          };
        }),
        updates: [],
        skips: [],
      };

      const options = {
        privateSettings: {
          contact_synchronized_segments: ["test1234"],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
      };

      const util = new FilterUtil(options);
      const actual = util.filterAccountEnvelopesToReevaluateForUpdate(
        initialResult,
        [],
      );
      expect(actual).toEqual({
        inserts: [],
        updates: [],
        skips: [],
      });
    });
  });

  describe("filterCompaniesUpdatedSince()", () => {
    it("should return only companies with updated_at after the specified timestamp", () => {
      const threshold = DateTime.utc().minus({ minutes: 10 }).toISO();
      const companies = _.cloneDeep(ApiResponseListAllCompanies);
      companies[0].updated_at = DateTime.utc().minus({ minutes: 5 }).toISO();
      companies[1].updated_at = DateTime.utc().minus({ hours: 5 }).toISO();

      const options = {
        privateSettings: {
          contact_synchronized_segments: ["test1234"],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
      };

      const util = new FilterUtil(options);
      const actual = util.filterCompaniesUpdatedSince(companies, threshold);
      expect(actual).toHaveLength(1);
      expect(actual).toEqual([companies[0]]);
    });
  });
});

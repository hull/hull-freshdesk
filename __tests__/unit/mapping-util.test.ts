import { MappingUtil } from "../../src/utils/mapping-util";
import UserUpdateNotification from "../_data/hull__user_update_message.json";
import IHullUserUpdateMessage from "../../src/types/user-update-message";
import {
  FreshdeskContactCreateUpdate,
  OutgoingOperationEnvelope,
  IncomingData,
  FreshdeskCompanyCreateOrUpdate,
  FreshdeskTicketPriority,
  FreshdeskTicketSource,
  FreshdeskTicketStatus,
} from "../../src/core/service-objects";
import ApiResponseContactFields from "../_data/api__list_all_contact_fields.json";
import _ from "lodash";
import ApiCreateContactResponse from "../_data/api__create_contact.json";
import { IHullUserClaims, IHullUserAttributes } from "../../src/types/user";
import AccountUpdateNotification from "../_data/hull__account_update_message.json";
import IHullAccountUpdateMessage from "../../src/types/account-update-message";
import ApiResponseCompanyFields from "../_data/api__list_all_company_fields.json";
import ApiCreateCompanyResponse from "../_data/api__create_company.json";
import {
  VALIDATION_SKIP_ACCOUNT_NODOMAINLOOKUP,
  VALIDATION_WARN_ACCOUNT_INVALIDMAPPINGOUT,
  VALIDATION_SKIP_ACCOUNT_NONAMEMAPPING,
} from "../../src/core/messages";
import {
  IHullAccountAttributes,
  IHullAccountClaims,
} from "../../src/types/account";
import ApiResponseListAllTickets from "../_data/api__list_all_tickets.json";

describe("MappingUtil", () => {
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
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const util = new MappingUtil(options);
      expect(util.logger).toBeDefined();
      expect(util.privateSettings).toEqual(options.privateSettings);
      expect(util.contactFields).toEqual(options.contactFields);
    });
  });

  describe("mapHullUserToServiceObject()", () => {
    it("should map a Hull User to a Freshdesk Contact", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
          ],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const userMessage = UserUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        message: userMessage,
        operation: "insert",
      };

      const expected: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        ...envelope,
        serviceObject: {
          name: userMessage.user.name,
          email: userMessage.user.email,
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullUserToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull User to a Freshdesk Contact and ignore incomplete mappings", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "foo",
              service: undefined,
              overwrite: true,
            },
          ],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const userMessage = UserUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        message: userMessage,
        operation: "insert",
      };

      const expected: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        ...envelope,
        serviceObject: {
          name: userMessage.user.name,
          email: userMessage.user.email,
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullUserToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull User to a Freshdesk Contact and skip when no email lookup", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "foo",
              service: undefined,
              overwrite: true,
            },
          ],
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
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const userMessage = UserUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        message: userMessage,
        operation: "insert",
      };

      const expected: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        ...envelope,
        operation: "skip",
        serviceObject: {
          name: userMessage.user.name,
        },
        notes: [
          "No email lookup attribute specified. Cannot synchronize contact.",
        ],
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullUserToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull User to a Freshdesk Contact and skip when no email lookup and add a note when present", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "foo",
              service: undefined,
              overwrite: true,
            },
          ],
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
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const userMessage = UserUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        message: userMessage,
        operation: "insert",
        notes: ["Previous note"],
      };

      const expected: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        ...envelope,
        operation: "skip",
        serviceObject: {
          name: userMessage.user.name,
        },
        notes: [
          "Previous note",
          "No email lookup attribute specified. Cannot synchronize contact.",
        ],
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullUserToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull User to a Freshdesk Contact with custom_field mappings", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "traits_unified/permanent",
              service: "permanent",
              overwrite: true,
            },
          ],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const userMessage = UserUpdateNotification.messages[0];
      _.set(userMessage, "user.traits_unified/permanent", true);
      const envelope: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        message: userMessage,
        operation: "insert",
      };

      const expected: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        ...envelope,
        serviceObject: {
          name: userMessage.user.name,
          email: userMessage.user.email,
          custom_fields: {
            permanent: true,
          },
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullUserToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull User to a Freshdesk Contact and ignore invalid mappings", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "foo",
              service: "foo",
              overwrite: true,
            },
          ],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const userMessage = UserUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        message: userMessage,
        operation: "insert",
      };

      const expected: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        ...envelope,
        serviceObject: {
          name: userMessage.user.name,
          email: userMessage.user.email,
        },
        notes: ["Invalid mapping to contact field 'foo' has been ignored."],
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullUserToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull User to a Freshdesk Contact and ignore invalid mappings by adding note when present", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "foo",
              service: "foo",
              overwrite: true,
            },
          ],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const userMessage = UserUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        message: userMessage,
        operation: "insert",
        notes: ["Previous note"],
      };

      const expected: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        ...envelope,
        serviceObject: {
          name: userMessage.user.name,
          email: userMessage.user.email,
        },
        notes: [
          "Previous note",
          "Invalid mapping to contact field 'foo' has been ignored.",
        ],
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullUserToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull User to a Freshdesk Contact with account attributes", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "account.name",
              service: "company_name",
              overwrite: true,
            },
          ],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      options.contactFields.push({
        editable_in_signup: false,
        id: 13,
        label: "Company",
        name: "company_name",
        position: 13,
        type: "custom_company_name",
        default: false,
        customers_can_edit: false,
        label_for_customers: "Company Name",
        required_for_customers: false,
        displayed_for_customers: false,
        required_for_agents: false,
        created_at: "2015-08-18T16:18:08Z",
        updated_at: "2015-08-18T16:18:08Z",
      });

      const userMessage = UserUpdateNotification.messages[0];
      _.set(userMessage, "account", {
        external_id: "test-group-wgl7y",
        id: "5eeb47e1d694429ff4e2676b",
        name: "Freshdesk Company 1",
        anonymous_ids: [],
        domain: "freshdeskcompany1.com",
        indexed_at: "2020-06-18T10:54:25.478Z",
        created_at: "2020-06-18T10:54:25.461Z",
      });
      const envelope: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        message: userMessage,
        operation: "insert",
      };

      const expected: OutgoingOperationEnvelope<
        IHullUserUpdateMessage,
        FreshdeskContactCreateUpdate
      > = {
        ...envelope,
        serviceObject: {
          name: userMessage.user.name,
          email: userMessage.user.email,
          custom_fields: {
            company_name: "Freshdesk Company 1",
          },
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullUserToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });
  });

  describe("mapServiceObjectToHullUser()", () => {
    it("should map a Freshdesk Contact to a Hull User", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [
            {
              hull: "traits_freshdesk/name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "traits_freshdesk/job_title",
              service: "job_title",
              overwrite: true,
            },
          ],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const expected: IncomingData<IHullUserClaims, IHullUserAttributes> = {
        objectType: "user",
        ident: {
          email: ApiCreateContactResponse.email,
          anonymous_id: `freshdesk:${ApiCreateContactResponse.id}`,
        },
        attributes: {
          "freshdesk/id": {
            value: ApiCreateContactResponse.id,
            operation: "setIfNull",
          },
          "freshdesk/email": ApiCreateContactResponse.email,
          "freshdesk/name": ApiCreateContactResponse.name,
          "freshdesk/job_title": ApiCreateContactResponse.job_title,
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapServiceObjectToHullUser(ApiCreateContactResponse);

      expect(actual).toEqual(expected);
    });

    it("should map a Freshdesk Contact to a Hull User without email", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [
            {
              hull: "traits_freshdesk/name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "traits_freshdesk/job_title",
              service: "job_title",
              overwrite: true,
            },
          ],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const expected: IncomingData<IHullUserClaims, IHullUserAttributes> = {
        objectType: "user",
        ident: {
          anonymous_id: `freshdesk:${ApiCreateContactResponse.id}`,
        },
        attributes: {
          "freshdesk/id": {
            value: ApiCreateContactResponse.id,
            operation: "setIfNull",
          },
          "freshdesk/name": ApiCreateContactResponse.name,
          "freshdesk/job_title": ApiCreateContactResponse.job_title,
        },
      };

      const serviceObject = {
        ...ApiCreateContactResponse,
      };

      _.unset(serviceObject, "email");

      const util = new MappingUtil(options);
      const actual = util.mapServiceObjectToHullUser(serviceObject);

      expect(actual).toEqual(expected);
    });

    it("should map a Freshdesk Contact with custom fields to a Hull User", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [
            {
              hull: "traits_freshdesk/name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "traits_freshdesk/job_title",
              service: "job_title",
              overwrite: true,
            },
            {
              hull: "traits_freshdesk/permanent",
              service: "permanent",
              overwrite: true,
            },
          ],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const expected: IncomingData<IHullUserClaims, IHullUserAttributes> = {
        objectType: "user",
        ident: {
          email: ApiCreateContactResponse.email,
          anonymous_id: `freshdesk:${ApiCreateContactResponse.id}`,
        },
        attributes: {
          "freshdesk/id": {
            value: ApiCreateContactResponse.id,
            operation: "setIfNull",
          },
          "freshdesk/email": ApiCreateContactResponse.email,
          "freshdesk/name": ApiCreateContactResponse.name,
          "freshdesk/job_title": ApiCreateContactResponse.job_title,
          "freshdesk/permanent": false,
        },
      };

      const freshdeskData = {
        ...ApiCreateContactResponse,
      };

      _.set(freshdeskData, "custom_fields.permanent", false);

      const util = new MappingUtil(options);
      const actual = util.mapServiceObjectToHullUser(freshdeskData);

      expect(actual).toEqual(expected);
    });

    it("should map a Freshdesk Contact to a Hull User and ignore invalid fields", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [
            {
              hull: "traits_freshdesk/name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "traits_freshdesk/job_title",
              service: "job_title",
              overwrite: true,
            },
            {
              hull: "traits_freshdesk/foo",
              service: "foo",
              overwrite: true,
            },
          ],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const expected: IncomingData<IHullUserClaims, IHullUserAttributes> = {
        objectType: "user",
        ident: {
          email: ApiCreateContactResponse.email,
          anonymous_id: `freshdesk:${ApiCreateContactResponse.id}`,
        },
        attributes: {
          "freshdesk/id": {
            value: ApiCreateContactResponse.id,
            operation: "setIfNull",
          },
          "freshdesk/email": ApiCreateContactResponse.email,
          "freshdesk/name": ApiCreateContactResponse.name,
          "freshdesk/job_title": ApiCreateContactResponse.job_title,
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapServiceObjectToHullUser(ApiCreateContactResponse);

      expect(actual).toEqual(expected);
    });

    it("should map a Freshdesk Contact to a Hull User and ignore incomplete mappings", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [
            {
              hull: "traits_freshdesk/name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "traits_freshdesk/job_title",
              service: "job_title",
              overwrite: true,
            },
            {
              hull: "traits_freshdesk/foo",
              service: undefined,
              overwrite: true,
            },
          ],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const expected: IncomingData<IHullUserClaims, IHullUserAttributes> = {
        objectType: "user",
        ident: {
          email: ApiCreateContactResponse.email,
          anonymous_id: `freshdesk:${ApiCreateContactResponse.id}`,
        },
        attributes: {
          "freshdesk/id": {
            value: ApiCreateContactResponse.id,
            operation: "setIfNull",
          },
          "freshdesk/email": ApiCreateContactResponse.email,
          "freshdesk/name": ApiCreateContactResponse.name,
          "freshdesk/job_title": ApiCreateContactResponse.job_title,
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapServiceObjectToHullUser(ApiCreateContactResponse);

      expect(actual).toEqual(expected);
    });
  });

  describe("mapHullAccountToServiceObject()", () => {
    it("should map a Hull Account to a Freshdesk Company", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
          ],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
          account_lookup_attribute_domain: "domain",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const accountMessage = AccountUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        message: accountMessage,
        operation: "insert",
      };

      const expected: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        ...envelope,
        serviceObject: {
          name: accountMessage.account.name,
          domains: [accountMessage.account.domain],
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullAccountToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull Account to a Freshdesk Company and ignore incomplete mappings", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "foo",
              service: null,
              overwrite: true,
            },
          ],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
          account_lookup_attribute_domain: "domain",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const accountMessage = AccountUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        message: accountMessage,
        operation: "insert",
      };

      const expected: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        ...envelope,
        serviceObject: {
          name: accountMessage.account.name,
          domains: [accountMessage.account.domain],
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullAccountToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull Account to a Freshdesk Company and skip when no domain lookup", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
          ],
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
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const accountMessage = AccountUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        message: accountMessage,
        operation: "insert",
      };

      const expected: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        ...envelope,
        operation: "skip",
        serviceObject: {
          name: accountMessage.account.name,
        },
        notes: [VALIDATION_SKIP_ACCOUNT_NODOMAINLOOKUP],
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullAccountToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull Account to a Freshdesk Company and skip when no domain lookup and add to previous notes", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
          ],
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
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const accountMessage = AccountUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        message: accountMessage,
        operation: "insert",
        notes: ["Previous note"],
      };

      const expected: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        ...envelope,
        operation: "skip",
        serviceObject: {
          name: accountMessage.account.name,
        },
        notes: ["Previous note", VALIDATION_SKIP_ACCOUNT_NODOMAINLOOKUP],
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullAccountToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull Account to a Freshdesk Company with custom_fields", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "domain",
              service: "website",
              overwrite: true,
            },
          ],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
          account_lookup_attribute_domain: "domain",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const accountMessage = AccountUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        message: accountMessage,
        operation: "insert",
      };

      const expected: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        ...envelope,
        serviceObject: {
          name: accountMessage.account.name,
          domains: [accountMessage.account.domain],
          custom_fields: {
            website: accountMessage.account.domain,
          },
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullAccountToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull Account to a Freshdesk Company and ignore invalid mappings", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "foo",
              service: "foo",
              overwrite: true,
            },
          ],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
          account_lookup_attribute_domain: "domain",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const accountMessage = AccountUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        message: accountMessage,
        operation: "insert",
      };

      const expected: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        ...envelope,
        serviceObject: {
          name: accountMessage.account.name,
          domains: [accountMessage.account.domain],
        },
        notes: [VALIDATION_WARN_ACCOUNT_INVALIDMAPPINGOUT("foo")],
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullAccountToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull Account to a Freshdesk Company and ignore invalid mappings and add to previous notes", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [
            {
              hull: "name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "foo",
              service: "foo",
              overwrite: true,
            },
          ],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
          account_lookup_attribute_domain: "domain",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const accountMessage = AccountUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        message: accountMessage,
        operation: "insert",
        notes: ["Previous note"],
      };

      const expected: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        ...envelope,
        serviceObject: {
          name: accountMessage.account.name,
          domains: [accountMessage.account.domain],
        },
        notes: [
          "Previous note",
          VALIDATION_WARN_ACCOUNT_INVALIDMAPPINGOUT("foo"),
        ],
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullAccountToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull Account to a Freshdesk Company and skip when no name mapping", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
          account_lookup_attribute_domain: "domain",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const accountMessage = AccountUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        message: accountMessage,
        operation: "insert",
      };

      const expected: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        unknown
      > = {
        ...envelope,
        operation: "skip",
        serviceObject: {
          domains: [accountMessage.account.domain],
        },
        notes: [VALIDATION_SKIP_ACCOUNT_NONAMEMAPPING],
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullAccountToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });

    it("should map a Hull Account to a Freshdesk Company and skip when no name mapping and add to previous notes", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
          account_lookup_attribute_domain: "domain",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const accountMessage = AccountUpdateNotification.messages[0];
      const envelope: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        FreshdeskCompanyCreateOrUpdate
      > = {
        message: accountMessage,
        operation: "insert",
        notes: ["Previous note"],
      };

      const expected: OutgoingOperationEnvelope<
        IHullAccountUpdateMessage,
        unknown
      > = {
        ...envelope,
        operation: "skip",
        serviceObject: {
          domains: [accountMessage.account.domain],
        },
        notes: ["Previous note", VALIDATION_SKIP_ACCOUNT_NONAMEMAPPING],
      };

      const util = new MappingUtil(options);
      const actual = util.mapHullAccountToServiceObject(envelope);
      expect(actual).toEqual(expected);
    });
  });

  describe("mapServiceObjectToHullAccount()", () => {
    it("should map a Freshdesk Company to a Hull Account", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [
            {
              hull: "freshdesk/name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "freshdesk/domains",
              service: "domains",
              overwrite: true,
            },
            {
              hull: "freshdesk/account_tier",
              service: "account_tier",
              overwrite: true,
            },
          ],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const expected: IncomingData<
        IHullAccountClaims,
        IHullAccountAttributes
      > = {
        objectType: "account",
        ident: {
          domain: ApiCreateCompanyResponse.domains[0],
          anonymous_id: `freshdesk:${ApiCreateCompanyResponse.id}`,
        },
        attributes: {
          "freshdesk/id": {
            value: ApiCreateCompanyResponse.id,
            operation: "setIfNull",
          },
          "freshdesk/domains": ApiCreateCompanyResponse.domains,
          "freshdesk/name": ApiCreateCompanyResponse.name,
          "freshdesk/account_tier": ApiCreateCompanyResponse.account_tier,
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapServiceObjectToHullAccount(
        ApiCreateCompanyResponse,
      );

      expect(actual).toEqual(expected);
    });

    it("should map a Freshdesk Company to a Hull Account without domains", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [
            {
              hull: "freshdesk/name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "freshdesk/domains",
              service: "domains",
              overwrite: true,
            },
            {
              hull: "freshdesk/account_tier",
              service: "account_tier",
              overwrite: true,
            },
          ],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const expected: IncomingData<
        IHullAccountClaims,
        IHullAccountAttributes
      > = {
        objectType: "account",
        ident: {
          anonymous_id: `freshdesk:${ApiCreateCompanyResponse.id}`,
        },
        attributes: {
          "freshdesk/id": {
            value: ApiCreateCompanyResponse.id,
            operation: "setIfNull",
          },
          "freshdesk/name": ApiCreateCompanyResponse.name,
          "freshdesk/account_tier": ApiCreateCompanyResponse.account_tier,
        },
      };

      const serviceObject = {
        ...ApiCreateCompanyResponse,
      };

      _.unset(serviceObject, "domains");

      const util = new MappingUtil(options);
      const actual = util.mapServiceObjectToHullAccount(serviceObject);

      expect(actual).toEqual(expected);
    });

    it("should map a Freshdesk Company to a Hull Account with custom fields", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [
            {
              hull: "freshdesk/name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "freshdesk/domains",
              service: "domains",
              overwrite: true,
            },
            {
              hull: "freshdesk/account_tier",
              service: "account_tier",
              overwrite: true,
            },
            {
              hull: "freshdesk/website",
              service: "website",
              overwrite: true,
            },
          ],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const expected: IncomingData<
        IHullAccountClaims,
        IHullAccountAttributes
      > = {
        objectType: "account",
        ident: {
          domain: ApiCreateCompanyResponse.domains[0],
          anonymous_id: `freshdesk:${ApiCreateCompanyResponse.id}`,
        },
        attributes: {
          "freshdesk/id": {
            value: ApiCreateCompanyResponse.id,
            operation: "setIfNull",
          },
          "freshdesk/domains": ApiCreateCompanyResponse.domains,
          "freshdesk/name": ApiCreateCompanyResponse.name,
          "freshdesk/account_tier": ApiCreateCompanyResponse.account_tier,
          "freshdesk/website": "supernova.com",
        },
      };

      const serviceObject = {
        ...ApiCreateCompanyResponse,
        custom_fields: {
          website: "supernova.com",
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapServiceObjectToHullAccount(serviceObject);

      expect(actual).toEqual(expected);
    });

    it("should map a Freshdesk Company to a Hull Account and ignore invalid mappings", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [
            {
              hull: "freshdesk/name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "freshdesk/domains",
              service: "domains",
              overwrite: true,
            },
            {
              hull: "freshdesk/account_tier",
              service: "account_tier",
              overwrite: true,
            },
            {
              hull: "freshdesk/foo",
              service: "foo",
              overwrite: true,
            },
          ],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const expected: IncomingData<
        IHullAccountClaims,
        IHullAccountAttributes
      > = {
        objectType: "account",
        ident: {
          domain: ApiCreateCompanyResponse.domains[0],
          anonymous_id: `freshdesk:${ApiCreateCompanyResponse.id}`,
        },
        attributes: {
          "freshdesk/id": {
            value: ApiCreateCompanyResponse.id,
            operation: "setIfNull",
          },
          "freshdesk/domains": ApiCreateCompanyResponse.domains,
          "freshdesk/name": ApiCreateCompanyResponse.name,
          "freshdesk/account_tier": ApiCreateCompanyResponse.account_tier,
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapServiceObjectToHullAccount(
        ApiCreateCompanyResponse,
      );

      expect(actual).toEqual(expected);
    });

    it("should map a Freshdesk Company to a Hull Account and ignore incomplete mappings", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [
            {
              hull: "freshdesk/name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "freshdesk/domains",
              service: "domains",
              overwrite: true,
            },
            {
              hull: "freshdesk/account_tier",
              service: "account_tier",
              overwrite: true,
            },
            {
              hull: "freshdesk/foo",
              service: undefined,
              overwrite: true,
            },
          ],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const expected: IncomingData<
        IHullAccountClaims,
        IHullAccountAttributes
      > = {
        objectType: "account",
        ident: {
          domain: ApiCreateCompanyResponse.domains[0],
          anonymous_id: `freshdesk:${ApiCreateCompanyResponse.id}`,
        },
        attributes: {
          "freshdesk/id": {
            value: ApiCreateCompanyResponse.id,
            operation: "setIfNull",
          },
          "freshdesk/domains": ApiCreateCompanyResponse.domains,
          "freshdesk/name": ApiCreateCompanyResponse.name,
          "freshdesk/account_tier": ApiCreateCompanyResponse.account_tier,
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapServiceObjectToHullAccount(
        ApiCreateCompanyResponse,
      );

      expect(actual).toEqual(expected);
    });
  });

  describe("mapTicketToHullEvent()", () => {
    it("should map a Freshdesk ticket without includes to a Hull event", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [
            {
              hull: "freshdesk/name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "freshdesk/domains",
              service: "domains",
              overwrite: true,
            },
            {
              hull: "freshdesk/account_tier",
              service: "account_tier",
              overwrite: true,
            },
          ],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const fdData = {
        ...ApiResponseListAllTickets[0],
      };

      const expected: IncomingData<IHullAccountClaims, IHullUserAttributes> = {
        objectType: "event",
        ident: {
          anonymous_id: `freshdesk:${fdData.requester_id}`,
        },
        attributes: {},
        context: {
          event_id: `fd-${fdData.id}-${fdData.updated_at}`,
          ip: 0,
          source: "freshdesk",
        },
        eventName: `Ticket ${
          fdData.created_at === fdData.updated_at ? "created" : "updated"
        }`,
        properties: {
          cc_emails: ["user@cc.com", "user2@cc.com"],
          fwd_emails: [],
          reply_cc_emails: ["user@cc.com", "user2@cc.com"],
          fr_escalated: false,
          spam: false,
          email_config_id: null,
          group_id: 2,
          priority: 1,
          priority_name: FreshdeskTicketPriority[1],
          requester_id: 5,
          responder_id: 1,
          source: 2,
          source_name: FreshdeskTicketSource[2],
          status: 2,
          status_name: FreshdeskTicketStatus[2],
          subject: "Please help",
          to_emails: null,
          product_id: null,
          id: 18,
          type: "Lead",
          created_at: "2015-08-17T12:02:50Z",
          updated_at: "2015-08-17T12:02:51Z",
          due_by: "2015-08-20T11:30:00Z",
          fr_due_by: "2015-08-18T11:30:00Z",
          is_escalated: false,
          custom_fields__category: "Default",
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapTicketToHullEvent(fdData);
      expect(actual).toEqual(expected);
    });

    it("should map a Freshdesk ticket with includes to a Hull event", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [
            {
              hull: "freshdesk/name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "freshdesk/domains",
              service: "domains",
              overwrite: true,
            },
            {
              hull: "freshdesk/account_tier",
              service: "account_tier",
              overwrite: true,
            },
          ],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const fdData = {
        ...ApiResponseListAllTickets[0],
        requester_id: 77024965158,
        requester: {
          id: 77024965158,
          name: "Matt Rogers",
          email: "matt.rogers@freshdesk.com",
          mobile: null,
          phone: null,
        },
        updated_at: "2020-06-18T07:08:04Z",
        stats: {
          agent_responded_at: "2020-06-18T07:08:04Z",
          requester_responded_at: null,
          first_responded_at: "2020-06-18T07:08:04Z",
          status_updated_at: "2020-06-18T07:08:04Z",
          reopened_at: null,
          resolved_at: null,
          closed_at: null,
          pending_since: null,
        },
      };

      const expected: IncomingData<IHullUserClaims, IHullUserAttributes> = {
        objectType: "event",
        ident: {
          anonymous_id: `freshdesk:${fdData.requester_id}`,
          email: fdData.requester.email,
        },
        attributes: {},
        context: {
          event_id: `fd-${fdData.id}-${fdData.updated_at}`,
          ip: 0,
          source: "freshdesk",
        },
        eventName: `Ticket ${
          fdData.created_at === fdData.updated_at ? "created" : "updated"
        }`,
        properties: {
          cc_emails: ["user@cc.com", "user2@cc.com"],
          fwd_emails: [],
          reply_cc_emails: ["user@cc.com", "user2@cc.com"],
          fr_escalated: false,
          spam: false,
          email_config_id: null,
          group_id: 2,
          priority: 1,
          priority_name: FreshdeskTicketPriority[1],
          requester_id: fdData.requester_id,
          responder_id: 1,
          source: 2,
          source_name: FreshdeskTicketSource[2],
          status: 2,
          status_name: FreshdeskTicketStatus[2],
          subject: "Please help",
          to_emails: null,
          product_id: null,
          id: 18,
          type: "Lead",
          created_at: "2015-08-17T12:02:50Z",
          updated_at: fdData.updated_at,
          due_by: "2015-08-20T11:30:00Z",
          fr_due_by: "2015-08-18T11:30:00Z",
          is_escalated: false,
          custom_fields__category: "Default",
          stats__agent_responded_at: "2020-06-18T07:08:04Z",
          stats__requester_responded_at: null,
          stats__first_responded_at: "2020-06-18T07:08:04Z",
          stats__status_updated_at: "2020-06-18T07:08:04Z",
          stats__reopened_at: null,
          stats__resolved_at: null,
          stats__closed_at: null,
          stats__pending_since: null,
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapTicketToHullEvent(fdData);
      expect(actual).toEqual(expected);
    });

    it("should map a Freshdesk ticket without includes and requester_id to a Hull event", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [],
          account_attributes_inbound: [
            {
              hull: "freshdesk/name",
              service: "name",
              overwrite: true,
            },
            {
              hull: "freshdesk/domains",
              service: "domains",
              overwrite: true,
            },
            {
              hull: "freshdesk/account_tier",
              service: "account_tier",
              overwrite: true,
            },
          ],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: {
          info: jest.fn(),
          log: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
        },
        contactFields: ApiResponseContactFields,
        companyFields: ApiResponseCompanyFields,
      };

      const fdData = {
        ...ApiResponseListAllTickets[0],
        requester_id: null,
        updated_at: ApiResponseListAllTickets[0].created_at,
      };

      const expected: IncomingData<IHullAccountClaims, IHullUserAttributes> = {
        objectType: "event",
        ident: {},
        attributes: {},
        context: {
          event_id: `fd-${fdData.id}-${fdData.updated_at}`,
          ip: 0,
          source: "freshdesk",
        },
        eventName: `Ticket ${
          fdData.created_at === fdData.updated_at ? "created" : "updated"
        }`,
        properties: {
          cc_emails: ["user@cc.com", "user2@cc.com"],
          fwd_emails: [],
          reply_cc_emails: ["user@cc.com", "user2@cc.com"],
          fr_escalated: false,
          spam: false,
          email_config_id: null,
          group_id: 2,
          priority: 1,
          priority_name: FreshdeskTicketPriority[1],
          requester_id: null,
          responder_id: 1,
          source: 2,
          source_name: FreshdeskTicketSource[2],
          status: 2,
          status_name: FreshdeskTicketStatus[2],
          subject: "Please help",
          to_emails: null,
          product_id: null,
          id: 18,
          type: "Lead",
          created_at: "2015-08-17T12:02:50Z",
          updated_at: ApiResponseListAllTickets[0].created_at,
          due_by: "2015-08-20T11:30:00Z",
          fr_due_by: "2015-08-18T11:30:00Z",
          is_escalated: false,
          custom_fields__category: "Default",
        },
      };

      const util = new MappingUtil(options);
      const actual = util.mapTicketToHullEvent(fdData);
      expect(actual).toEqual(expected);
    });
  });
});

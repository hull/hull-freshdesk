import { MappingUtil } from "../../src/utils/mapping-util";
import UserUpdateNotification from "../_data/hull__user_update_message.json";
import IHullUserUpdateMessage from "../../src/types/user-update-message";
import {
  FreshdeskContactCreateUpdate,
  OutgoingOperationEnvelope,
  IncomingData,
} from "../../src/core/service-objects";
import ApiResponseContactFields from "../_data/api__list_all_contact_fields.json";
import _ from "lodash";
import ApiCreateContactResponse from "../_data/api__create_contact.json";
import { IHullUserClaims, IHullUserAttributes } from "../../src/types/user";

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
        logger: console,
        contactFields: ApiResponseContactFields,
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
        logger: console,
        contactFields: ApiResponseContactFields,
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
        logger: console,
        contactFields: ApiResponseContactFields,
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
        logger: console,
        contactFields: ApiResponseContactFields,
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
        logger: console,
        contactFields: ApiResponseContactFields,
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
        logger: console,
        contactFields: ApiResponseContactFields,
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
        logger: console,
        contactFields: ApiResponseContactFields,
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
        logger: console,
        contactFields: ApiResponseContactFields,
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
        logger: console,
        contactFields: ApiResponseContactFields,
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
        logger: console,
        contactFields: ApiResponseContactFields,
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
        logger: console,
        contactFields: ApiResponseContactFields,
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
        logger: console,
        contactFields: ApiResponseContactFields,
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
        logger: console,
        contactFields: ApiResponseContactFields,
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
});

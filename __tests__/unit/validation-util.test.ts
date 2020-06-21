import { ValidationUtil } from "../../src/utils/validation-util";
import ApiResponseContactFields from "../_data/api__list_all_contact_fields.json";
import ApiResponseCompanyFields from "../_data/api__list_all_company_fields.json";
import { STATUS_WARN_FIELDDOESNTEXIST } from "../../src/core/messages";

describe("ValidationUtil", () => {
  describe("constructor()", () => {
    it("should initialize privateSettings and logger", () => {
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

      const util = new ValidationUtil(options);
      expect(util.logger).toBeDefined();
      expect(util.privateSettings).toEqual(options.privateSettings);
    });
  });

  describe("validateContactFields()", () => {
    it("should return an empty list if no fields are mapped", () => {
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
        },
        logger: console,
      };

      const util = new ValidationUtil(options);
      const actual = util.validateContactFields(ApiResponseContactFields);
      expect(actual).toHaveLength(0);
    });

    it("should return an empty list if all fields are valid", () => {
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
          contact_attributes_inbound: [
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
      };

      const util = new ValidationUtil(options);
      const actual = util.validateContactFields(ApiResponseContactFields);
      expect(actual).toHaveLength(0);
    });

    it("should return a list of error messages for invalid fields", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [
            {
              hull: "traits_test/foo",
              service: "foo",
              overwrite: true,
            },
          ],
          contact_attributes_inbound: [
            {
              hull: "traits_freshdesk/baz",
              service: "baz",
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
      };

      const util = new ValidationUtil(options);
      const actual = util.validateContactFields(ApiResponseContactFields);
      expect(actual).toHaveLength(2);
      expect(actual).toContain(
        STATUS_WARN_FIELDDOESNTEXIST("foo", "Contacts > Outgoing Attributes"),
      );
      expect(actual).toContain(
        STATUS_WARN_FIELDDOESNTEXIST("baz", "Contacts > Incoming Fields"),
      );
    });
  });

  describe("validateCompanyFields()", () => {
    it("should return an empty list if no fields are mapped", () => {
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
        },
        logger: console,
      };

      const util = new ValidationUtil(options);
      const actual = util.validateCompanyFields(ApiResponseCompanyFields);
      expect(actual).toHaveLength(0);
    });

    it("should return an empty list if all fields are valid", () => {
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
          account_attributes_inbound: [
            {
              hull: "freshdesk/name",
              service: "name",
              overwrite: true,
            },
          ],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: console,
      };

      const util = new ValidationUtil(options);
      const actual = util.validateCompanyFields(ApiResponseCompanyFields);
      expect(actual).toHaveLength(0);
    });

    it("should return a list of error messages for invalid fields", () => {
      const options = {
        privateSettings: {
          contact_synchronized_segments: [],
          contact_attributes_outbound: [],
          contact_attributes_inbound: [],
          account_synchronized_segments: [],
          account_attributes_outbound: [
            {
              hull: "test/foo",
              service: "foo",
              overwrite: true,
            },
          ],
          account_attributes_inbound: [
            {
              hull: "freshdesk/baz",
              service: "baz",
              overwrite: true,
            },
          ],
          account_filter_inbound_require_domain: false,
          contact_lookup_attribute_email: "email",
        },
        logger: console,
      };

      const util = new ValidationUtil(options);
      const actual = util.validateCompanyFields(ApiResponseCompanyFields);
      expect(actual).toHaveLength(2);
      expect(actual).toContain(
        STATUS_WARN_FIELDDOESNTEXIST("foo", "Companies > Outgoing Attributes"),
      );
      expect(actual).toContain(
        STATUS_WARN_FIELDDOESNTEXIST("baz", "Companies > Incoming Fields"),
      );
    });
  });
});

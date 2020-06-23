import _ from "lodash";
import payload from "../../_data/hull__user_update_message.json";
import { API_KEY, API_DOMAIN } from "../../_helpers/constants";
import ApiResponseCreateContact from "../../_data/api__create_contact.json";

const basePayload = _.cloneDeep(payload);

const configurePayload = (): unknown => {
  // Configure private_settings
  _.set(basePayload, "connector.private_settings.api_key", API_KEY);
  _.set(basePayload, "connector.private_settings.domain", API_DOMAIN);
  _.set(
    basePayload,
    "connector.private_settings.contact_synchronized_segments",
    ["72abf64e-7f60-4d7e-85b8-5f2f572318bb"],
  );
  _.set(basePayload, "connector.private_settings.account_attributes_inbound", [
    {
      hull: "freshdesk/name",
      service: "name",
      overwrite: true,
    },
    {
      hull: "freshdesk/description",
      service: "description",
      overwrite: true,
    },
  ]);
  // Configure segments
  const msgSegments = [
    {
      id: "72abf64e-7f60-4d7e-85b8-5f2f572318bb",
      created_at: new Date().toISOString(),
      name: "Test Segment",
      type: "users_segment",
      updated_at: new Date().toISOString(),
      stats: {},
    },
  ];
  // Set the user segments
  _.set(basePayload, "messages[0].segments", msgSegments);
  // Set the user attributes
  _.set(basePayload, "messages[0].user.name", ApiResponseCreateContact.name);
  _.set(basePayload, "messages[0].user.email", ApiResponseCreateContact.email);
  _.set(
    basePayload,
    "messages[0].user.traits_unified/job_title",
    ApiResponseCreateContact.job_title,
  );

  return basePayload;
};

// eslint-disable-next-line import/no-default-export
export default configurePayload;

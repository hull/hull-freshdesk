import { ContextMock } from "../../_helpers/mocks";
import ApiResponseUpdateContact from "../../_data/api__update_contact.json";

/* eslint-disable @typescript-eslint/no-explicit-any */
const setupExpectations = (ctx: ContextMock): void => {
  expect((ctx.client.logger.info as any).mock.calls).toHaveLength(1);
  expect((ctx.client.logger.info as any).mock.calls[0]).toEqual([
    "outgoing.user.success",
    {
      data: {
        email: ApiResponseUpdateContact.email,
        name: ApiResponseUpdateContact.name,
        job_title: ApiResponseUpdateContact.job_title,
      },
      operation: "update",
      details: undefined,
    },
  ]);
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line import/no-default-export
export default setupExpectations;

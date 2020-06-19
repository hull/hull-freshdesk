import { ContextMock } from "../../_helpers/mocks";
import ApiResponseCreateContact from "../../_data/api__create_contact.json";

/* eslint-disable @typescript-eslint/no-explicit-any */
const setupExpectations = (ctx: ContextMock): void => {
  expect((ctx.client.logger.info as any).mock.calls).toHaveLength(1);
  expect((ctx.client.logger.info as any).mock.calls[0]).toEqual([
    "outgoing.user.success",
    {
      data: {
        email: ApiResponseCreateContact.email,
        name: ApiResponseCreateContact.name,
        job_title: ApiResponseCreateContact.job_title,
      },
      operation: "insert",
      details: undefined,
    },
  ]);
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line import/no-default-export
export default setupExpectations;

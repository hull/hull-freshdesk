import { ContextMock } from "../../_helpers/mocks";
import ApiResponseUpdateCompany from "../../_data/api__update_company.json";

/* eslint-disable @typescript-eslint/no-explicit-any */
const setupExpectations = (ctx: ContextMock): void => {
  expect((ctx.client.logger.info as any).mock.calls).toHaveLength(1);
  expect((ctx.client.logger.info as any).mock.calls[0]).toEqual([
    "outgoing.account.success",
    {
      data: {
        domains: [ApiResponseUpdateCompany.domains[0]],
        name: ApiResponseUpdateCompany.name,
        description: ApiResponseUpdateCompany.description,
      },
      operation: "update",
      details: undefined,
    },
  ]);
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line import/no-default-export
export default setupExpectations;

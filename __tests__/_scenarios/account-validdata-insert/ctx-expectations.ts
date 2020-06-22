import { ContextMock } from "../../_helpers/mocks";
import ApiResponseCreateCompany from "../../_data/api__create_company.json";

/* eslint-disable @typescript-eslint/no-explicit-any */
const setupExpectations = (ctx: ContextMock): void => {
  expect((ctx.client.logger.info as any).mock.calls).toHaveLength(1);
  expect((ctx.client.logger.info as any).mock.calls[0]).toEqual([
    "outgoing.account.success",
    {
      data: {
        domains: [ApiResponseCreateCompany.domains[0]],
        name: ApiResponseCreateCompany.name,
        description: ApiResponseCreateCompany.description,
      },
      operation: "insert",
      details: undefined,
    },
  ]);
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line import/no-default-export
export default setupExpectations;

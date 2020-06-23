import { ContextMock } from "../../_helpers/mocks";
import ApiResponseListAllCompanies from "../../_data/api__list_all_companies.json";

/* eslint-disable @typescript-eslint/no-explicit-any */
const setupExpectations = (ctx: ContextMock): void => {
  // Info logs for job.start, job.progress, job.success and every record
  expect((ctx.client.logger.info as any).mock.calls).toHaveLength(3 + 1);
  expect((ctx.client.logger.info as any).mock.calls[0]).toEqual([
    "incoming.job.start",
    {
      objectType: "companies",
      jobType: "incremental",
    },
  ]);
  expect((ctx.client.logger.info as any).mock.calls[1]).toEqual([
    "incoming.job.progress",
    {
      objectType: "companies",
      jobType: "incremental",
      page: 1,
      perPage: 100,
      hasMore: false,
      count: ApiResponseListAllCompanies.length,
    },
  ]);

  const v = ApiResponseListAllCompanies[0];
  expect((ctx.client.logger.info as any).mock.calls[2]).toEqual([
    "incoming.account.success",
    {
      attributes: {
        "freshdesk/domains": v.domains,
        "freshdesk/name": v.name,
        "freshdesk/description": v.description,
        "freshdesk/id": {
          value: v.id,
          operation: "setIfNull",
        },
      },
      objectType: "companies",
      jobType: "incremental",
    },
  ]);

  expect((ctx.client.logger.info as any).mock.calls[1 + 1 + 1]).toEqual([
    "incoming.job.success",
    {
      objectType: "companies",
      jobType: "incremental",
    },
  ]);
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line import/no-default-export
export default setupExpectations;

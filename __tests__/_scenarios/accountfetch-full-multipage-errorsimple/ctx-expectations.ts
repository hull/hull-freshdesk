import { ContextMock } from "../../_helpers/mocks";
import ApiResponseListAllCompanies from "../../_data/api__list_all_companies.json";

/* eslint-disable @typescript-eslint/no-explicit-any */
const setupExpectations = (ctx: ContextMock): void => {
  // Info logs for job.start, job.progress, job.success and every record
  expect((ctx.client.logger.info as any).mock.calls).toHaveLength(
    2 + ApiResponseListAllCompanies.length,
  );
  expect((ctx.client.logger.error as any).mock.calls).toHaveLength(1);
  expect((ctx.client.logger.info as any).mock.calls[0]).toEqual([
    "incoming.job.start",
    {
      objectType: "companies",
      jobType: "full",
    },
  ]);
  expect((ctx.client.logger.info as any).mock.calls[1]).toEqual([
    "incoming.job.progress",
    {
      objectType: "companies",
      jobType: "full",
      page: 1,
      perPage: 100,
      hasMore: true,
      count: ApiResponseListAllCompanies.length,
    },
  ]);

  ApiResponseListAllCompanies.forEach((v, i) => {
    expect((ctx.client.logger.info as any).mock.calls[2 + i]).toEqual([
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
        jobType: "full",
      },
    ]);
  });

  expect((ctx.client.logger.error as any).mock.calls[0]).toEqual([
    "incoming.job.error",
    {
      objectType: "companies",
      jobType: "full",
      error: "Something went wrong",
    },
  ]);
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line import/no-default-export
export default setupExpectations;

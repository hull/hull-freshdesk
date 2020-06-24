import { ContextMock } from "../../_helpers/mocks";
import ApiResponseListAllTickets from "../../_data/api__list_all_tickets.json";

/* eslint-disable @typescript-eslint/no-explicit-any */
const setupExpectations = (ctx: ContextMock): void => {
  // Info logs for job.start, job.progress, job.success and every record
  expect((ctx.client.logger.info as any).mock.calls).toHaveLength(
    3 + ApiResponseListAllTickets.length,
  );
  expect((ctx.client.logger.info as any).mock.calls[0]).toEqual([
    "incoming.job.start",
    {
      objectType: "tickets",
      jobType: "incremental",
    },
  ]);
  expect((ctx.client.logger.info as any).mock.calls[1]).toEqual([
    "incoming.job.progress",
    {
      objectType: "tickets",
      jobType: "incremental",
      page: 1,
      perPage: 100,
      hasMore: false,
      count: ApiResponseListAllTickets.length,
    },
  ]);

  ApiResponseListAllTickets.forEach((v, i) => {
    expect((ctx.client.logger.info as any).mock.calls[2 + i]).toMatchObject([
      "incoming.event.success",
      {
        context: {
          source: "freshdesk",
        },
        properties: {
          id: v.id,
        },
        objectType: "tickets",
        jobType: "incremental",
      },
    ]);
  });

  expect(
    (ctx.client.logger.info as any).mock.calls[
      1 + ApiResponseListAllTickets.length + 1
    ],
  ).toEqual([
    "incoming.job.success",
    {
      objectType: "tickets",
      jobType: "incremental",
    },
  ]);
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line import/no-default-export
export default setupExpectations;

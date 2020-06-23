import { ContextMock } from "../../_helpers/mocks";
import ApiResponseListAllContacts from "../../_data/api__list_all_contacts.json";

/* eslint-disable @typescript-eslint/no-explicit-any */
const setupExpectations = (ctx: ContextMock): void => {
  // Info logs for job.start, job.progress, job.success and every record
  expect((ctx.client.logger.info as any).mock.calls).toHaveLength(
    3 + ApiResponseListAllContacts.length,
  );
  expect((ctx.client.logger.info as any).mock.calls[0]).toEqual([
    "incoming.job.start",
    {
      objectType: "contacts",
      jobType: "incremental",
    },
  ]);
  expect((ctx.client.logger.info as any).mock.calls[1]).toEqual([
    "incoming.job.progress",
    {
      objectType: "contacts",
      jobType: "incremental",
      page: 1,
      perPage: 100,
      hasMore: false,
      count: ApiResponseListAllContacts.length,
    },
  ]);

  ApiResponseListAllContacts.forEach((v, i) => {
    expect((ctx.client.logger.info as any).mock.calls[2 + i]).toEqual([
      "incoming.user.success",
      {
        attributes: {
          "freshdesk/email": v.email,
          "freshdesk/name": v.name,
          "freshdesk/job_title": v.job_title,
          "freshdesk/id": {
            value: v.id,
            operation: "setIfNull",
          },
        },
        objectType: "contacts",
        jobType: "incremental",
      },
    ]);
  });

  expect(
    (ctx.client.logger.info as any).mock.calls[
      1 + ApiResponseListAllContacts.length + 1
    ],
  ).toEqual([
    "incoming.job.success",
    {
      objectType: "contacts",
      jobType: "incremental",
    },
  ]);
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line import/no-default-export
export default setupExpectations;

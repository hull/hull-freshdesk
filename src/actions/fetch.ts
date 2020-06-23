import { Request, Response, RequestHandler } from "express";
import { AwilixContainer } from "awilix";
import { SyncAgent } from "../core/sync-agent";
import { Logger } from "winston";
import {
  ERROR_OBJECTTYPE_UNDEFINED_CODE,
  ERROR_OBJECTTYPE_UNDEFINED,
  ERROR_JOBTYPE_NOTSUPPORTED_CODE,
  ERROR_JOBTYPE_NOTSUPPORTED,
} from "../core/messages";
import { ConnectorRedisClient } from "../utils/redis-client";
import { isNil } from "lodash";
import { DateTime } from "luxon";

type FetchObjectType = "contacts" | "companies";

export const fetchHandlerFactory = (
  container: AwilixContainer,
): RequestHandler => {
  return async (req: Request, res: Response): Promise<unknown> => {
    const objectType = req.params.type as FetchObjectType;

    if (objectType === undefined) {
      res.status(400).json({
        ok: false,
        description: "Validation Error",
        errors: [
          {
            code: ERROR_OBJECTTYPE_UNDEFINED_CODE,
            message: ERROR_OBJECTTYPE_UNDEFINED,
          },
        ],
      });
      return Promise.resolve(false);
    }
    const jobType = req.params.jobType as string;
    const supportedTypes = ["full", "incremental"];
    if (!supportedTypes.includes(jobType)) {
      res.status(400).json({
        ok: false,
        description: "Validation Error",
        errors: [
          {
            code: ERROR_JOBTYPE_NOTSUPPORTED_CODE,
            message: ERROR_JOBTYPE_NOTSUPPORTED(jobType),
          },
        ],
      });
      return Promise.resolve(false);
    }

    let logger = undefined;

    try {
      const { client, ship, metric } = (req as any).hull;
      const syncAgent = new SyncAgent(client, ship, metric, container);
      logger = container.resolve<Logger>("logger");
      logger.debug(`Starting ${jobType} fetch job for '${objectType}'...`);
      let updatedSince: string | undefined = undefined;
      if (jobType === "incremental") {
        const redisClnt = container.resolve<ConnectorRedisClient>(
          "redisClient",
        );
        let lastJobIso = await redisClnt.get<string>(
          `${ship.id}_lastjob_${objectType}`,
        );
        if (isNil(lastJobIso)) {
          let interval = 10;
          switch (objectType) {
            case "companies":
              interval = 30;
              break;
            default:
              interval = 5;
              break;
          }
          lastJobIso = DateTime.utc().minus({ minutes: interval }).toISO();
        }
        updatedSince = lastJobIso;
      }

      if (objectType === "contacts") {
        syncAgent.fetchContacts(updatedSince);
      } else if (objectType === "companies") {
        syncAgent.fetchCompanies(updatedSince);
      }

      logger.debug(`Started ${jobType} fetch job for '${objectType}'.`);
      res.status(200).json({ ok: true });
      return Promise.resolve(true);
    } catch (error) {
      if (logger !== undefined) {
        (logger as Logger).error(error);
      }
      const payload = {
        ok: false,
        error: `An unhandled error occured.`,
      };

      res.status(500).json(payload);
      return Promise.resolve(false);
    }
  };
};

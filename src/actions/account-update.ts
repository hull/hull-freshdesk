import IHullAccountUpdateMessage from "../types/account-update-message";
import { SyncAgent } from "../core/sync-agent";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const accountUpdateHandlerFactory = (
  options: any = {},
): ((ctx: any, messages: IHullAccountUpdateMessage[]) => Promise<any>) => {
  const {
    flowControl = null,
    isBatch = false,
    container = undefined,
  } = options;
  return function accountUpdateHandler(
    ctx: any,
    messages: IHullAccountUpdateMessage[],
  ): Promise<any> {
    try {
      if (ctx.smartNotifierResponse && flowControl) {
        ctx.smartNotifierResponse.setFlowControl(flowControl);
      }
      const agent = new SyncAgent(ctx.client, ctx.ship, ctx.metric, container);

      if (messages.length > 0) {
        return agent.sendAccountMessages(messages, isBatch);
      }
      return Promise.resolve(true);
    } catch (error) {
      console.log(error);
      return Promise.resolve(false);
    }
  };
};

/* eslint-enable @typescript-eslint/no-explicit-any */

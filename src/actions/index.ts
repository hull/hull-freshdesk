import { statusActionFactory } from "./status";
import { userUpdateHandlerFactory } from "./user-update";
import { accountUpdateHandlerFactory } from "./account-update";

export default {
  status: statusActionFactory,
  userUpdate: userUpdateHandlerFactory,
  accountUpdate: accountUpdateHandlerFactory,
};

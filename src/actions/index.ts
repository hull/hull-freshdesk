import { statusActionFactory } from "./status";
import { userUpdateHandlerFactory } from "./user-update";
import { accountUpdateHandlerFactory } from "./account-update";
import { metaFieldsHandlerFactory } from "./meta-fields";

export default {
  status: statusActionFactory,
  userUpdate: userUpdateHandlerFactory,
  accountUpdate: accountUpdateHandlerFactory,
  metaFields: metaFieldsHandlerFactory,
};

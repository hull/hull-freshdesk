import IHullUserChanges from "./user-changes";
import IHullSegment from "./hull-segment";
import IHullAccount from "./account";

export default interface IHullAccountUpdateMessage {
    changes?: IHullUserChanges;
    account_segments: IHullSegment[];
    account?: IHullAccount;
    message_id: string;
}
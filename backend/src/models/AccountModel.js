import { model } from "mongoose";
import { AccountSchema } from "../schemas/AccountSchema.js";

const AccountModel = model("account", AccountSchema);

export { AccountModel };

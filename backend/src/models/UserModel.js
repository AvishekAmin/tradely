import { model } from "mongoose";
import { UserSchema } from "../schemas/UserSchema.js";

const UserModel = model("User", UserSchema);

export { UserModel };

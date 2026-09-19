import { model } from "mongoose";
import { OcoGroupSchema } from "../schemas/OcoGroupSchema.js";

const OcoGroupModel = model("ocogroup", OcoGroupSchema);

export { OcoGroupModel };

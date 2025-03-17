import mongoose from "mongoose";

export const isValidId = (ID) => {
  return mongoose.Types.ObjectId.isValid(ID);
};

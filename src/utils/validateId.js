import mongoose from "mongoose";

export const isValidId = (ID) => {
  return mongoose.Types.ObjectId.isValid(ID);
  // if (!ID || !mongoose.Types.ObjectId.isValid(ID)) {
  //   throw new ApiError(400, "Invalid " + idName);
  // }
};

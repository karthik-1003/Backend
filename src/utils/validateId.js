import mongoose from "mongoose";
import { ApiError } from "./apiError.js";

export const isValidId = (ID, idName) => {
  // return mongoose.Types.ObjectId.isValid(ID);
  if (!ID || !mongoose.Types.ObjectId.isValid(ID)) {
    throw new ApiError(400, `Invalid ${idName}`);
  }
};

export const checkForEmptyResult = (output, entity) => {
  if (!output) {
    throw new ApiError(404, `There's no ${entity} with given id`);
  }
};

export const checkForServerError = (output, operation) => {
  if (!output) {
    throw new ApiError(500, `Not able to ${operation} at this moment`);
  }
};

export const authorizationError = () => {
  throw new ApiError(401, "You're not authourised to perform this operation");
};

//authorization error
//update error
//cannot perform this operation at the moment = done
//checkforemptyresult= done

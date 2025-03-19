import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  authorizationError,
  checkForEmptyResult,
  checkForServerError,
  isValidId,
} from "../utils/validateId.js";

export const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const user = req.user._id;

  isValidId(videoId, "videoId");

  if (!content) {
    throw new ApiError(400, "There's no comment to add");
  }
  const isValidVideoId = await Video.findById(videoId);

  checkForEmptyResult(isValidVideoId, "video");

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: user,
  });

  checkForServerError(comment, "add comment");

  return res
    .status(200)
    .json(new ApiResponse(201, comment, "comment added successfully"));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const user = req.user._id;

  isValidId(commentId, "commentId");

  const comment = await Comment.findById(commentId);

  checkForEmptyResult(comment, "comment");

  if (comment.owner.toString() !== user.toString()) {
    authorizationError();
  }

  const isCommentDeleted = await Comment.deleteOne({ _id: commentId });
  checkForServerError(isCommentDeleted.acknowledged, "delete comment");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  isValidId(commentId, "commentId");

  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "There's nothing to update");
  }
  const comment = await Comment.findById(commentId);

  checkForEmptyResult(comment, "comment");

  const user = req.user._id;
  if (comment.owner.toString() !== user.toString()) {
    authorizationError();
  }

  comment.content = content;

  const updatedComment = await comment.save();

  checkForServerError(updateComment, "update comment");

  res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated Successfully"));
});

export const getAllComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  isValidId(videoId, "videoId");

  const video = await Video.findById(videoId);
  checkForEmptyResult(video, "video");

  const options = { page, limit };

  const comments = await Comment.aggregatePaginate(
    [
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
      "__PREPAGINATE__",
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                username: 1,
                _id: 0,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: { $first: "$owner.username" },
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
    ],
    options
  );

  res
    .status(200)
    .json(new ApiResponse(200, comments.docs, "Comments fetched successfully"));
});

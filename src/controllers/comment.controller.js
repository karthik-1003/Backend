import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const user = req.user._id;

  if (!videoId) {
    throw new ApiError(
      400,
      "VideoId is required for adding comment to a video"
    );
  }
  if (!content) {
    throw new ApiError(400, "There's no comment to add");
  }
  const isValidVideoId = await Video.findById(videoId);

  if (!isValidVideoId) {
    throw new ApiError(400, "There's no video with the given Id");
  }
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: user,
  });

  if (!comment) {
    throw new ApiError(500, "Not able add comment at this moment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment added successfully"));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const user = req.user._id;

  if (!commentId) {
    throw new ApiError(400, "CommentId is required");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "There's no comment with given Id");
  }
  if (comment.owner.toString() !== user.toString()) {
    throw new ApiError(400, "You're not authourised to delete this comment");
  }

  const isCommentDeleted = await Comment.deleteOne({ _id: commentId });
  if (!isCommentDeleted.acknowledged) {
    throw new ApiError(500, "Comment cannot be deleted at this moment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

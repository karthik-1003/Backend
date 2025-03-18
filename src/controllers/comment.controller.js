import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidId } from "../utils/validateId.js";

export const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const user = req.user._id;

  if (!videoId || !isValidId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
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

  if (!commentId || !isValidId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
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

export const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId || !isValidId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "There's nothing to update");
  }
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "There's no comment with the given Id");
  }
  const user = req.user._id;
  if (comment.owner.toString() !== user.toString()) {
    throw new ApiError(400, "You're not authorized to update this comment");
  }

  comment.content = content;

  const updatedComment = await comment.save();

  if (!updatedComment) {
    throw new ApiError(500, "cannot update comment at this moment");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated Successfully"));
});

export const getAllComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  if (!videoId || !isValidId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "There's video with the given Id");
  }

  const comments = await Comment.aggregatePaginate([
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
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
    {
      $sort: { updatedAt: -1 },
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, comments.docs, "Comments fetched successfully"));
});

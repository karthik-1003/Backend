import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidId } from "../utils/validateId.js";

export const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "There's no video with given Id");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });
  if (existingLike) {
    await Like.deleteOne(existingLike);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "removed like on video"));
  } else {
    await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    return res.status(200).json(new ApiResponse(200, {}, "Liked a video"));
  }
});

export const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId || !isValidId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "There's no comment with given ID");
  }
  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    await Like.deleteOne(existingLike);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Removed like on a comment"));
  } else {
    await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    return res.status(200).json(new ApiResponse(200, {}, "Liked a comment"));
  }
});

export const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId || !isValidId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "There's no tweet with given Id");
  }
  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });
  if (existingLike) {
    await Like.deleteOne(existingLike);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Removed like on a Tweet"));
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    return res.status(200).json(new ApiResponse(200, {}, "Liked a Tweet"));
  }
});

export const getVideoLikes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "There's no video with given Id");
  }
  const videoLikes = (await Like.find({ video: videoId })).length;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videoId, videoLikes },
        "VideoLikes fetched successfully"
      )
    );
});

export const getUserLikedVideos = asyncHandler(async (req, res) => {
  const user = req.user._id;
  const { page = 1, limit = 10 } = req.query;
  const likedVideos = await Like.aggregatePaginate([
    {
      $match: {
        likedBy: user,
        video: { $exists: true },
      },
    },
    "__PREPAGINATE__",
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $addFields: {
        video: {
          $first: "$video",
        },
      },
    },
    {
      $project: {
        video: 1,
        _id: 0,
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  const userLikedVideos = likedVideos.docs.map(
    (likedvideo) => likedvideo.video
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userLikedVideos,
        "user liked videos fetched successfully"
      )
    );
});

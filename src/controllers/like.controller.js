import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { checkForEmptyResult, isValidId } from "../utils/validateId.js";

export const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  isValidId(videoId, "videoId");

  const video = await Video.findById(videoId);
  checkForEmptyResult(video, "video");

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
  isValidId(commentId, "commentId");

  const comment = await Comment.findById(commentId);
  checkForEmptyResult(comment, "comment");

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
  isValidId(tweetId, "tweetId");

  const tweet = await Tweet.findById(tweetId);
  checkForEmptyResult(tweet, "tweet");

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
  isValidId(videoId, "videoId");

  const video = await Video.findById(videoId);
  checkForEmptyResult(video, "video");

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
  const options = { page, limit };
  const likedVideos = await Like.aggregatePaginate(
    [
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
        $sort: {
          createdAt: -1,
        },
      },
    ],
    options
  );

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

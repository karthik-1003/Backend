import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  checkForEmptyResult,
  checkForServerError,
  isValidId,
} from "../utils/validateId.js";

export const addTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "There's no content");
  }

  const tweet = await Tweet.create({ content, owner: req.user._id });
  checkForServerError(tweet, "create tweet");

  res.status(201).json(new ApiResponse(200, tweet, "Tweet added successfully"));
});

export const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  isValidId(tweetId, "tweetId");

  const tweet = await Tweet.findByIdAndDelete(tweetId);
  checkForEmptyResult(tweet, "tweet");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  isValidId(tweetId, "tweetId");

  if (!content) {
    throw new ApiError(400, "content is required");
  }
  const tweet = await Tweet.findById(tweetId);
  checkForEmptyResult(tweet, "tweet");

  tweet.content = content;
  const updatedTweet = await tweet.save();
  checkForServerError(updatedTweet, "update tweet");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated Successfully"));
});

export const getUserTweets = asyncHandler(async (req, res) => {
  const user = req.user._id;

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: user,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});

export const getAllTweets = asyncHandler(async (req, res) => {
  const tweets = await Tweet.aggregate([
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidId } from "../utils/validateId.js";

export const addTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "There's no content");
  }

  const tweet = await Tweet.create({ content, owner: req.user._id });

  if (!tweet) {
    throw new ApiError(500, "Not able to add this tweet at this moment");
  }

  res.status(200).json(new ApiResponse(200, tweet, "Tweet added successfully"));
});

export const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId || !isValidId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const tweet = await Tweet.findByIdAndDelete(tweetId);

  if (!tweet) {
    throw new ApiError(400, "There is no tweet with the given id");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId || !isValidId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }
  if (!content) {
    throw new ApiError(400, "content is required");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "There's is no tweet with given Id");
  }
  tweet.content = content;
  const updatedTweet = await tweet.save();

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
  const tweets = await Tweet.find();

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteImageOnCloudinary,
  deleteVideoOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import {
  authorizationError,
  checkForEmptyResult,
  checkForServerError,
  isValidId,
} from "../utils/validateId.js";

export const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = ".*",
    sortBy = "_id",
    sortType = "desc",
  } = req.query;

  const options = { page, limit };

  const videos = await Video.aggregatePaginate(
    [
      {
        $match: {
          isPublished: true,
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
      },
      "__PREPAGINATE__",
      {
        $sort: { [sortBy]: sortType === "desc" ? -1 : 1, createdAt: -1 },
      },
    ],
    options
  );

  res
    .status(200)
    .json(new ApiResponse(200, videos.docs, "videos fetched successfully"));
});

export const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoFilePath = req.files?.videoFile[0]?.path;
  const thumbnailPath = req.files?.thumbnail[0]?.path;

  if (!title || !description || !videoFilePath || !thumbnailPath) {
    throw new ApiError(400, "All fields are required");
  }

  const videoFile = await uploadOnCloudinary(videoFilePath);
  const thumbnail = await uploadOnCloudinary(thumbnailPath);

  checkForServerError(videoFile, "upload video");
  checkForServerError(thumbnail, "upload thumbnail");

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: videoFile.duration,
    owner: req.user._id,
  });

  checkForServerError(video, "create video");

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Uploaded Video Successfully"));
});

export const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user._id;
  isValidId(videoId, "videoId");

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
        owner: user,
      },
    },
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
              avatar: 1,
              _id: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  if (!video.length) {
    throw new ApiError(
      400,
      "Video is not available in the database or video is private"
    );
  }

  if (
    video.isPublished === false &&
    video.owner.toString() !== user.toString()
  ) {
    throw new ApiError(403, "This video is not published by owner");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched Successfully"));
});

export const updateVideoDetails = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user._id;
  isValidId(videoId, "videoId");

  const { title, description } = req.body;
  const thumbnailPath = req.file?.path;

  if (!(title || description || thumbnailPath)) {
    throw new ApiError(400, "There's nothing to update");
  }

  const video = await Video.findById(videoId);
  checkForEmptyResult(video, "video");

  if (user.toString() !== video.owner.toString()) {
    authorizationError();
  }

  if (title) {
    video.title = title;
  }
  if (description) {
    video.description = description;
  }
  if (thumbnailPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    if (thumbnail) {
      await deleteImageOnCloudinary(video.thumbnail);
    }

    video.thumbnail = thumbnail.url;
  }

  const updatedVideo = await video.save();
  checkForServerError(updatedVideo, "update video details");

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video details updated successfully")
    );
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  isValidId(videoId, "videoId");

  const video = await Video.findById(videoId);
  const user = req.user._id;
  checkForEmptyResult(video, "video");

  if (video.owner.toString() !== user.toString()) {
    authorizationError();
  }
  const isVideoDeleted = await Video.deleteOne({ _id: videoId });

  if (isVideoDeleted.acknowledged) {
    await deleteImageOnCloudinary(video.thumbnail);
    await deleteVideoOnCloudinary(video.videoFile);
  }

  checkForServerError(isVideoDeleted.acknowledged, "delete video");
  return res
    .status(200)
    .json(new ApiResponse("200", {}, "Video deleted successfully"));
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  isValidId(videoId, "videoId");

  const video = await Video.findById(videoId);
  checkForEmptyResult(video, "video");

  const user = req.user._id;
  if (video.owner.toString() !== user.toString()) {
    authorizationError();
  }

  video.isPublished = !video.isPublished;
  const updatedVideo = await video.save();
  checkForServerError(updatedVideo, "toggle publish status");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Publish Status updated Successfully"));
});

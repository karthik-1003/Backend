import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

export const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
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

  if (!videoFile || !thumbnail) {
    throw new ApiError(500, "Error while uploading videofiles");
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: videoFile.duration,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(500, "Unable to upload video");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Uploaded Video Successfully"));
});

export const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user._id;
  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
  if (!videoId) {
    throw new ApiError(400, "VideoId is required");
  }

  const { title, description } = req.body;
  const thumbnailPath = req.file?.path;

  if (!(title || description || thumbnailPath)) {
    throw new ApiError(400, "There's nothing to update");
  }

  const video = await Video.findById(videoId);

  if (user.toString() !== video.owner.toString()) {
    throw new ApiError(401, "You're not authorized to update this video");
  }

  if (title) {
    video.title = title;
  }
  if (description) {
    video.description = description;
  }
  if (thumbnailPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    //remove existing video from cloudinary
    video.thumbnail = thumbnail.url;
  }

  const updatedVideo = await video.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video details updated successfully")
    );
});

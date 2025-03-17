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

export const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = ".*",
    sortBy = "_id",
    sortType = "desc",
  } = req.query;

  const videos = await Video.aggregatePaginate([
    {
      $match: {
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
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, videos?.docs, "videos fetched successfully"));
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

  if (!video.length) {
    throw new ApiError(400, "Video is not available in the database");
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
  if (!videoId) {
    throw new ApiError(400, "VideoId is required");
  }

  const { title, description } = req.body;
  const thumbnailPath = req.file?.path;

  if (!(title || description || thumbnailPath)) {
    throw new ApiError(400, "There's nothing to update");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "requested video is not available in the database");
  }

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

    if (thumbnail) {
      await deleteImageOnCloudinary(video.thumbnail);
    }

    video.thumbnail = thumbnail.url;
  }

  const updatedVideo = await video.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video details updated successfully")
    );
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "VideoId is required");
  }
  const video = await Video.findById(videoId);
  const user = req.user._id;
  if (!video) {
    throw new ApiError(404, "requested video is not available in the database");
  }
  if (video.owner.toString() !== user.toString()) {
    throw new ApiError(400, "You are not authorized to delete this video");
  }
  const isVideoDeleted = await Video.deleteOne({ _id: videoId });

  if (isVideoDeleted.acknowledged) {
    await deleteImageOnCloudinary(video.thumbnail);
    await deleteVideoOnCloudinary(video.videoFile);
  }
  if (!isVideoDeleted) {
    throw new ApiError(500, "Unable to delete Video");
  }

  return res
    .status(200)
    .json(new ApiResponse("200", {}, "Video deleted successfully"));
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "VideoId is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "There is no video with given Id");
  }
  const user = req.user._id;
  if (video.owner.toString() !== user.toString()) {
    throw new ApiError(
      400,
      "You are not authorized to change the status of this video"
    );
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Publish Status updated Successfully"));
});

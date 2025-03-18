import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js ";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  authorizationError,
  checkForEmptyResult,
  checkForServerError,
  isValidId,
} from "../utils/validateId.js";

export const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    throw new ApiError(400, "Name and description is required");
  }
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });
  checkForServerError(playlist, "create playlist");
  // if (!playlist) {
  //   throw new ApiError(500, "Not able to create playlist at this moment");
  // }
  return res
    .status(201)
    .json(new ApiResponse(200, playlist, "Playlist created"));
});

export const getUserPlaylists = asyncHandler(async (req, res) => {
  const user = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const userPlaylists = await Playlist.aggregatePaginate([
    {
      $match: {
        owner: user,
      },
    },
    "__PREPAGINATE__",
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ]);
  checkForEmptyResult(userPlaylists.docs.length, "playlist");
  // if (!userPlaylists.docs.length) {
  //   throw new ApiError(400, "There's no playlist with given Id");
  // }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userPlaylists.docs,
        "userPlaylists fetched successfully"
      )
    );
});

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;
  isValidId(videoId, "videoId");
  isValidId(playlistId, "playlistId");
  // if (
  //   !videoId ||
  //   !playlistId ||
  //   !isValidId(videoId) ||
  //   !isValidId(playlistId)
  // ) {
  //   throw new ApiError(400, "Invalid playlistId or videoId");
  // }

  const video = await Video.findById(videoId);
  checkForEmptyResult(video, "video");
  // if (!video) {
  //   throw new ApiError(400, "There's no video with given Id");
  // }
  const playlist = await Playlist.findById(playlistId);
  checkForEmptyResult(playlist, "playlist");
  // if (!playlist) {
  //   throw new ApiError(400, "There's no playlist with given Id");
  // }

  if (playlist.videos.includes(videoId)) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "video is already present in the playlist")
      );
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );
  checkForServerError(updatedPlaylist, "add video to playlist");

  return res
    .status(201)
    .json(new ApiResponse(200, updatedPlaylist, "video added to playlist"));
});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  isValidId(videoId, "videoId");
  isValidId(playlistId, "playlistId");
  // if (
  //   !playlistId ||
  //   !videoId ||
  //   !isValidId(playlistId) ||
  //   !isValidId(videoId)
  // ) {
  //   throw new ApiError(400, "Invalid playlistId or videoId");
  // }

  const playlist = await Playlist.findOne({ _id: playlistId, videos: videoId });

  if (!playlist) {
    throw new ApiError(
      400,
      "Either there's no playlist or there's no video in the playlist"
    );
  }

  const index = playlist.videos.indexOf(videoId);
  playlist.videos.splice(index, 1);
  const result = await playlist.save();
  checkForServerError(result, "remove video from playlist");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video removed from playlist"));
});

export const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // if (!playlistId || !isValidId(playlistId)) {
  //   throw new ApiError(400, "Invalid playlistId");
  // }
  isValidId(playlistId, "playlistId");

  const playlist = await Playlist.aggregatePaginate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    "__PREPAGINATE__",
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ]);

  // if (!playlist.docs.length) {
  //   throw new ApiError(400, "There's no playlist with given Id");
  // }
  checkForEmptyResult(playlist.docs.length, "playlist");
  return res
    .status(200)
    .json(new ApiResponse(200, playlist.docs, "Playlist fetched successfully"));
});

export const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  // if (!playlistId || !isValidId(playlistId)) {
  //   throw new ApiError(400, "Invalid playlistId");
  // }
  isValidId(playlistId, "playlistId");
  const playlist = await Playlist.findById(playlistId);
  // if (!playlist) {
  //   throw new ApiError(400, "There's no playlist with givenId");
  // }
  checkForEmptyResult(playlist, "playlist");
  if (!name && !description) {
    throw new ApiError(400, "There's nothing to update");
  }
  if (name) {
    playlist.name = name;
  }
  if (description) {
    playlist.description = description;
  }
  const updatedPlaylist = await playlist.save();
  checkForServerError(updatedPlaylist, "update playlist details");
  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "updated playlist details"));
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  isValidId(playlistId, "playlistId");
  // if (!playlistId || !isValidId(playlistId)) {
  //   throw new ApiError(400, "Invalid playlistID");
  // }

  //TODO: change isValidId function to more generalized one
  //   isValidId(playlistId, "playlistId");
  const playlist = await Playlist.findById(playlistId);
  // if (!playlist) {
  //   throw new ApiError(400, "There's no playlist with given Id");
  // }
  checkForEmptyResult(playlist, "playlist");
  if (playlist.owner.toString() !== req.user._id) {
    authorizationError();
  }

  const deletedPlaylist = await Playlist.deleteOne({
    _id: playlistId,
    owner: req.user._id,
  });
  checkForServerError(deletedPlaylist.acknowledged, "delete playlist");
  // if (!deletedPlaylist.acknowledged) {
  //   throw new ApiError(500, "Cannot delete playlist at the moment");
  // }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/createplaylist").post(createPlaylist);
router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);
router.route("/").get(getUserPlaylists);
router.route("/add/:playlistId/:videoId").post(addVideoToPlaylist);
router.route("/remove/:playlistId/:videoId").delete(removeVideoFromPlaylist);

export default router;

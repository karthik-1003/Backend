import { Router } from "express";
import {
  getUserLikedVideos,
  getVideoLikes,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/toggle/video/:videoId").post(toggleVideoLike);
router.route("/toggle/comment/:commentId").post(toggleCommentLike);
router.route("/toggle/tweet/:tweetId").post(toggleTweetLike);
router.route("/video/:videoId").get(getVideoLikes);
router.route("/getuserlikedvideos/").get(getUserLikedVideos);

export default router;

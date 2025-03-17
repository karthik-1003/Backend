import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addTweet,
  deleteTweet,
  getAllTweets,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(addTweet).get(getAllTweets);
router.route("/:tweetId").delete(deleteTweet).patch(updateTweet);
router.route("/getUserTweets/").get(getUserTweets);

export default router;

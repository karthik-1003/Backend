import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addTweet, deleteTweet } from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(addTweet);
router.route("/:tweetId").delete(deleteTweet);

export default router;

import { Router } from "express";
import {
  addComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/addComment/:videoId").post(addComment);
router.route("/deletecomment/:commentId").delete(deleteComment);

export default router;

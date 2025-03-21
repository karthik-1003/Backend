import { Router } from "express";
import {
  addComment,
  deleteComment,
  getAllComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/addComment/:videoId").post(addComment);
router.route("/deletecomment/:commentId").delete(deleteComment);
router.route("/updatecomment/:commentId").patch(updateComment);
router.route("/getComments/:videoId").get(getAllComments);

export default router;

import { Router, type IRouter } from "express";
import { requireAuth } from "../middleware/auth";
import healthRouter from "./health";
import tradesRouter from "./trades";
import ritualsRouter from "./rituals";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requireAuth, tradesRouter);
router.use(requireAuth, ritualsRouter);
router.use(requireAuth, aiRouter);

export default router;

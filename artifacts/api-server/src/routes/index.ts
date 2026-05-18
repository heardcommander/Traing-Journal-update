import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tradesRouter from "./trades";
import ritualsRouter from "./rituals";
import aiRouter from "./ai";
import billingRouter from "./billing";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requireAuth);
router.use(tradesRouter);
router.use(ritualsRouter);
router.use(aiRouter);
router.use(billingRouter);

export default router;

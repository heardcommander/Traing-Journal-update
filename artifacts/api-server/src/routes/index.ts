import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tradesRouter from "./trades";
import ritualsRouter from "./rituals";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tradesRouter);
router.use(ritualsRouter);
router.use(aiRouter);

export default router;

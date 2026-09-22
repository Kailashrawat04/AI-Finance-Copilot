import { Router, type IRouter } from "express";
import healthRouter from "./health";
import financeRouter from "./finance";
import assistantRouter from "./assistant";

const router: IRouter = Router();

router.use(healthRouter);
router.use(financeRouter);
router.use(assistantRouter);

export default router;

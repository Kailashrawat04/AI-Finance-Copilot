import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import healthRouter from "./health";
import financeRouter from "./finance";
import assistantRouter from "./assistant";

const router: IRouter = Router();

router.use(healthRouter);
router.use((req, res, next) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.locals.userId = userId;
  next();
});
router.use(financeRouter);
router.use(assistantRouter);

export default router;

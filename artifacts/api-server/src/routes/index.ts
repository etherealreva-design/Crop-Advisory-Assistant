import { Router, type IRouter } from "express";
import healthRouter from "./health";
import advisoryRouter from "./advisory";
import cropsRouter from "./crops";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cropsRouter);
router.use(advisoryRouter);

export default router;

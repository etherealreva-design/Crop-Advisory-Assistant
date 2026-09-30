import { and, arrayContains, asc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  db,
  cropsTable,
} from "@workspace/db";
import {
  ListCropsQueryParams,
  ListCropsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/crops", async (req, res): Promise<void> => {
  const query = ListCropsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid crop filters." });
    return;
  }

  const conditions = [eq(cropsTable.isActive, true)];
  if (query.data.category) {
    conditions.push(eq(cropsTable.category, query.data.category));
  }
  if (query.data.soil) {
    conditions.push(
      arrayContains(cropsTable.compatibleSoils, [query.data.soil]),
    );
  }

  const crops = await db
    .select()
    .from(cropsTable)
    .where(and(...conditions))
    .orderBy(asc(cropsTable.name));

  res.json(ListCropsResponse.parse(crops));
});

export default router;
import { Router, type IRouter } from "express";
import { db, advisoryRequestsTable } from "@workspace/db";
import {
  SubmitAdvisoryBody,
  SubmitAdvisoryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function isValidCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return false;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

router.post("/advisory", async (req, res): Promise<void> => {
  const parsed = SubmitAdvisoryBody.safeParse(req.body);
  if (!parsed.success || !isValidCalendarDate(parsed.data.dateObserved)) {
    res.status(400).json({
      error: "Please check the submitted field report details.",
    });
    return;
  }

  const [request] = await db
    .insert(advisoryRequestsTable)
    .values({
      farmerName: parsed.data.farmerName.trim(),
      phone: parsed.data.phone.trim(),
      location: parsed.data.location.trim(),
      dateObserved: parsed.data.dateObserved,
      farmSizeAcres: parsed.data.farmSizeAcres,
      issueDescription: parsed.data.issueDescription.trim(),
    })
    .returning({
      id: advisoryRequestsTable.id,
      status: advisoryRequestsTable.status,
      createdAt: advisoryRequestsTable.createdAt,
    });

  res
    .status(201)
    .json(SubmitAdvisoryResponse.parse(request));
});

export default router;
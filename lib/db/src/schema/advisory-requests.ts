import { createInsertSchema } from "drizzle-zod";
import {
  date,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const advisoryStatuses = [
  "Pending",
  "Analyzed",
  "In Progress",
  "Resolved",
] as const;

export const advisoryRequestsTable = pgTable("advisory_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerName: varchar("farmer_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  dateObserved: date("date_observed", { mode: "string" }).notNull(),
  farmSizeAcres: numeric("farm_size_acres", {
    precision: 10,
    scale: 2,
    mode: "number",
  }).notNull(),
  issueDescription: text("issue_description").notNull(),
  status: varchar("status", { length: 50 })
    .$type<(typeof advisoryStatuses)[number]>()
    .notNull()
    .default("Pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertAdvisoryRequestSchema = createInsertSchema(
  advisoryRequestsTable,
).omit({ id: true, status: true, createdAt: true });

export type InsertAdvisoryRequest = z.infer<
  typeof insertAdvisoryRequestSchema
>;
export type AdvisoryRequest = typeof advisoryRequestsTable.$inferSelect;
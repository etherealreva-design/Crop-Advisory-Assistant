import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const cropCategories = [
  "Cereals",
  "Pulses",
  "Cash Crops",
  "Fruits",
  "Vegetables",
  "Oilseeds",
] as const;

export const soilTypes = [
  "Clay",
  "Sandy",
  "Loamy",
  "Peaty",
  "Chalky",
  "Silty",
] as const;

export const cropsTable = pgTable("crops", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  optimalTemperature: varchar("optimal_temperature", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  compatibleSoils: text("compatible_soils")
    .array()
    .notNull()
    .default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCropSchema = createInsertSchema(cropsTable)
  .omit({ id: true, createdAt: true, isActive: true })
  .extend({
    category: z.enum(cropCategories),
    compatibleSoils: z.array(z.enum(soilTypes)).default([]),
  });

export type InsertCrop = z.infer<typeof insertCropSchema>;
export type Crop = typeof cropsTable.$inferSelect;
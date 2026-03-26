import { z } from "zod";

export const projectNameSchema = z
  .string()
  .min(3, "Project name must be at least 3 characters long")
  .max(50, "Project name must be at most 50 characters long");

export const projectPathSchema = z
  .string()
  .min(1, "Project path cannot be empty");

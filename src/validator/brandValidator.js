import { z } from "zod";

// Tạo schema với Zod
const brandSchema = z.object({
  brandName: z.string().min(2, "Brand name must be at least 2 characters"),
  logo: z.string().url("Logo must be a valid URL"),
});

export { brandSchema };
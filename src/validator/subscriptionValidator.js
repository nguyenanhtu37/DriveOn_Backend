import { z } from "zod";

export const subscriptionSchema  = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().min(1),
  pricePerMonth: z.number().positive(),
});
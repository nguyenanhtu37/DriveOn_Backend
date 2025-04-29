import { z } from "zod";

export const subscriptionSchema = z.object({
  name: z.string(),
  code: z.string(),
  description: z.string(),
  price: z.number(),        
  month: z.number(),         
});
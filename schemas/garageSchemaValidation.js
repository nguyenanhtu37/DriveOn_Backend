import { z } from "zod";

export const garageRegisterSchemaValidation = z.object({
  name: z.string().nonempty(),
  phone: z
    .string()
    .regex(/^\d{10,11}$/)
    .nonempty(),
  email: z.string().email().optional(),
  description: z.string().nonempty(),
  working: z.object({
    openTime: z.string().nonempty(),
    closeTime: z.string().nonempty(),
    operating_days: z
      .array(
        z.enum([
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ])
      )
      .nonempty(),
  }),
  businessLicense: z.string().optional(),
  images: z.array(z.string()).optional(),
  location: z.object({
    address: z.string().nonempty(),
    gps: z
      .object({
        lat: z.number().nullable().default(null),
        lng: z.number().nullable().default(null),
      })
      .optional(),
  }),
  tag: z.enum(["pro", "normal"]).default("normal"),
});

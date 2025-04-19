import { z } from "zod";

export const providerSchema = z.object({
  userId: z.string().uuid({ message: "Please select a valid user." }),
  licenseNumber: z.string().nonempty("Please enter a license number."),
  credentials: z.string().nonempty("Please enter credentials."),
  signature: z.string().nullable(),
  serviceFeeStructure: z.enum(["HOURLY", "FLAT_RATE", "PER_DIEM"], {
    errorMap: () => ({ message: "Please select a service fee structure." }),
  }),
  nssEnabled: z.boolean(),
  reviewNotes: z.preprocess(
    (val) => (typeof val === "string" ? { notes: val } : val),
    z.object({ notes: z.string() })
  ).default({ notes: "" }),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"], {
    errorMap: () => ({ message: "Please select a status." }),
  }),
});

export type providerSchemaValues = z.infer<typeof providerSchema>;

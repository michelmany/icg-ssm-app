import { z } from "zod";

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export type resetPasswordSchemaValues = z.infer<typeof resetPasswordSchema>;

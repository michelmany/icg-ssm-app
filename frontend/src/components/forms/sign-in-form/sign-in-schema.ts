import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().nonempty("Please enter a password."),
});

export type signInSchemaValues = z.infer<typeof signInSchema>;

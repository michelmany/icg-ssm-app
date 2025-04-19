import { z } from "zod";

export const schoolSchema = z.object({
  name: z.string().nonempty("Please enter a name."),
  district: z.string().nonempty("Please enter a district."), // TODO: change this to a select
  state: z.string().nonempty("Please enter a state."), // TODO: change this to a select
  contactEmail: z.string().email("Please enter a valid email."),
  maxTravelDistance: z.number({ coerce: true }).gt(0),
  maxStudentsPerTest: z.number({ coerce: true }).gt(0),
});

export type schoolSchemaValues = z.infer<typeof schoolSchema>;

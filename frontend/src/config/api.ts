import { assertValues } from "./assertValues";

export const API_URL = assertValues(
  process.env.API_URL,
  "API_URL environment variable is missing.",
);

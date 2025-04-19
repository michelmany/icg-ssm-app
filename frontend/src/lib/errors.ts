import { Error as ErrorObject } from "./api/types";

export class TNError extends Error {
  code: string;
  constructor(error: ErrorObject) {
    super(error.message);
    this.code = error.code ?? "TN_ERROR";
  }
}

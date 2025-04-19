export namespace Errors {
  const ErrorStatuses: Partial<Record<ErrorCode, number>> = {
    INVALID_CREDENTIALS: 400,
    INACTIVE_ACCOUNT: 401,
  };

  type ErrorCode =
    | "INVALID_CREDENTIALS"
    | "INACTIVE_ACCOUNT"
    | "UNAUTHORIZED"
    | "UNAUTHENTICATED"
    | "INVALID_RESET_TOKEN"
    | "RESET_TOKEN_EXPIRED"
    | "USER_NOT_FOUND"
    | "SCHOOL_NOT_FOUND"
    | "STUDENT_NOT_FOUND"
    | "PROVIDER_NOT_FOUND"
    | "THERAPIST_NOT_FOUND"
    | "THERAPY_SERVICE_NOT_FOUND"
    | "REPORT_NOT_FOUND"
    | "DOCUMENT_NOT_FOUND"
    | "CONTRACT_NOT_FOUND"
    | "CONTACT_NOT_FOUND"
    | "INTERNAL_ERROR"
    | "INVOICE_NOT_FOUND";

  interface TNErrorOptions {
    status?: number;
    code?: ErrorCode;
    errors?: string[];
  }

  export class TNError extends Error {
    name: string = "TNError";
    status: number = 500;
    code: ErrorCode = "INTERNAL_ERROR";
    message: string = "An internal error occured.";
    errors?: string[];

    constructor(err?: string | unknown, options?: TNErrorOptions) {
      super();

      if (err instanceof Error) {
        this.cause = err.cause;
        this.message = err.message;
      } else if (typeof err === "string") {
        this.message = err ?? this.message;
      }

      if (options) {
        const { status, code, errors } = options;
        this.status = status ?? this.status;
        this.code = code ?? this.code;
        this.status = status ?? this.status ?? ErrorStatuses[this.code];
        this.errors = errors;
      }

      this.status = ErrorStatuses[this.code] ?? this.status;
    }
  }

  export const IsError = (e: unknown, code?: ErrorCode): e is TNError => {
    if (!code) {
      return e instanceof TNError;
    }

    return e instanceof TNError && e.code === code;
  };
}

import { assertValues } from "./assertValues";

export namespace AuthConfig {
  export const AUTH_SECRET = assertValues(
    process.env.AUTH_SECRET,
    "Missing AUTH_SECRET environment variable.",
  );

  export const BCRYPT_ROUNDS = parseInt(
    assertValues(
      process.env.BCRYPT_ROUNDS,
      "Missing BCRYPT_ROUNDS environment variable.",
    ),
  );

  export const PASSWORD_RESET_TOKEN_LENGTH =
    parseInt(process.env.RESET_TOKEN_LENGTH ?? "12") || 12;

  export const PASSWORD_RESET_TOKEN_MAX_AGE =
    parseInt(process.env.PASSWORD_RESET_TOKEN_MAX_AGE ?? "86400") || 86400;
}

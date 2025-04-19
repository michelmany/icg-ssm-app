export namespace AppConfig {
  export const APP_URL = process.env.APP_URL ?? "http://localhost:8888";
  export const PASSWORD_RESET_URL =
    process.env.APP_URL ?? "http://localhost:8888/reset-password";
  export const INVITE_URL =
    process.env.APP_URL ?? "http://localhost:8888/accept-invite";
}

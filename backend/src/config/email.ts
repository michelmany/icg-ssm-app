import { assertValues } from "./assertValues";

export namespace EmailConfig {
  export const SMTP_HOST = process.env.SMTP_HOST ?? "localhost";
  export const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "1025") || 1025;

  export const FROM =
    process.env.EMAIL_FROM ?? "TNRSM Project <johnny@tnrsm-project.com>";

  export const API_KEY = process.env.SENDGRID_API_KEY ?? "";
}

import nodemailer from "nodemailer";
import { EmailConfig } from "../config/email";
import {
  createInviteUserEmail,
  createPasswordResetEmail,
} from "tn-transactional";
import { AppConfig } from "../config/app";

export namespace Emails {
  // Define the transport config interface to include the auth property
  interface TransportConfig {
    host: string;
    port: number;
    secure: boolean;
    ignoreTLS: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  }

  // Create the transport config object
  const transportConfig: TransportConfig = {
    host: EmailConfig.SMTP_HOST,
    port: EmailConfig.SMTP_PORT,
    secure: false,
    ignoreTLS: true,
  };

  // Add auth if API_KEY is available
  if (EmailConfig.API_KEY) {
    transportConfig.auth = {
      user: "apikey",
      pass: EmailConfig.API_KEY,
    };
  }

  // Pass the config to createTransport
  const transport = nodemailer.createTransport(transportConfig);

  interface SendEmailOptions {
    to: string;
  }

  interface SendPasswordResetEmailOptions {
    token: string;
  }

  export const sendPasswordResetEmail = async ({
    to,
    token,
  }: SendEmailOptions & SendPasswordResetEmailOptions) => {
    const url = new URL(AppConfig.PASSWORD_RESET_URL);
    url.searchParams.set("token", token);
    const html = await createPasswordResetEmail({ url: url.toString() });
    await transport.sendMail({
      from: EmailConfig.FROM,
      subject: "Reset your password",
      to,
      html,
    });
  };

  interface SendInviteEmailOptions {
    token: string;
  }

  export const sendInviteEmail = async ({
    to,
    token,
  }: SendEmailOptions & SendInviteEmailOptions) => {
    const url = new URL(AppConfig.INVITE_URL);
    url.searchParams.set("token", token);
    const html = await createInviteUserEmail({ url: url.toString() });
    await transport.sendMail({
      from: EmailConfig.FROM,
      subject: "Setup your TN account",
      to,
      html,
    });
  };
}
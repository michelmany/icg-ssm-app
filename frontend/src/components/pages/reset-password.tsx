"use client";

import { ResetPasswordForm } from "../forms/reset-password-form/reset-password-form";
import startPasswordResetAction from "@/lib/actions/auth/start-password-reset";
import { resetPasswordSchemaValues } from "../forms/reset-password-form/reset-password-schema";

export const ResetPasswordPage = () => {
  const handleResetPassword = async (values: resetPasswordSchemaValues) => {
    const { success, message } = await startPasswordResetAction(values);
    if (!success) {
      throw new Error(message);
    }
  };
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Reset your password
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <ResetPasswordForm resetPassword={handleResetPassword} />
      </div>
    </div>
  );
};

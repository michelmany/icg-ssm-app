"use client";

import confirmPasswordResetAction from "@/lib/actions/auth/confirm-password-reset";
import { ConfirmResetPasswordForm } from "../forms/confirm-reset-password-form/confirm-reset-password-form";
import { confirmResetPasswordSchemaValues } from "../forms/confirm-reset-password-form/confirm-reset-password-schema";

interface ConfirmResetPasswordPageProps {
  token: string;
}

export const ConfirmResetPasswordPage = ({
  token,
}: ConfirmResetPasswordPageProps) => {
  const handleConfirmResetPassword = async (
    values: confirmResetPasswordSchemaValues,
  ) => {
    const { success, message } = await confirmPasswordResetAction({
      ...values,
      token,
    });
    if (!success) {
      throw new Error(message);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Change your password
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <ConfirmResetPasswordForm
          confirmResetPassword={handleConfirmResetPassword}
        />
      </div>
    </div>
  );
};

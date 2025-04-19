import { useForm } from "react-hook-form";
import { Button } from "sd-tnrsm-library";
import {
  confirmResetPasswordSchema,
  confirmResetPasswordSchemaValues,
} from "./confirm-reset-password-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

interface ConfirmResetPasswordFormProps {
  confirmResetPassword: (
    values: confirmResetPasswordSchemaValues,
  ) => Promise<void>;
}

export const ConfirmResetPasswordForm = ({
  confirmResetPassword,
}: ConfirmResetPasswordFormProps) => {
  const { register, handleSubmit, formState, setError } =
    useForm<confirmResetPasswordSchemaValues>({
      resolver: zodResolver(confirmResetPasswordSchema),
    });

  const { errors, isSubmitting, isSubmitSuccessful } = formState;

  const submit = async (values: confirmResetPasswordSchemaValues) => {
    try {
      await confirmResetPassword(values);
    } catch (e) {
      if (e instanceof Error && e.message) {
        setError("root", {
          message: e.message,
        });
      }
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="text-md text-green-700 text-center">
        <p>Your password has been reset!</p>
        <p>
          Please{" "}
          <Link
            className="font-semibold text-indigo-600 hover:text-indigo-500"
            href="/"
          >
            login
          </Link>{" "}
          to access the dashboard.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(submit)}>
      <div>
        <label
          htmlFor="email"
          className="block text-sm/6 font-medium text-gray-900"
        >
          Email address
        </label>
        <div className="mt-2">
          <input
            {...register("email")}
            id="email"
            autoComplete="email"
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
        {errors?.email && (
          <p className="text-red-600 text-sm mt-2">{errors?.email?.message}</p>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Password
          </label>
        </div>
        <div className="mt-2">
          <input
            {...register("newPassword")}
            id="password"
            type="password"
            autoComplete="new-password"
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
        {errors?.newPassword && (
          <p className="text-red-600 text-sm mt-2">
            {errors?.newPassword?.message}
          </p>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="confirmPassword"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Confirm Password
          </label>
        </div>
        <div className="mt-2">
          <input
            {...register("confirmNewPassword")}
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
        {errors?.confirmNewPassword && (
          <p className="text-red-600 text-sm mt-2">
            {errors?.confirmNewPassword?.message}
          </p>
        )}
      </div>
      {errors?.root && (
        <p className="text-red-600 text-sm mt-2 text-center">
          {errors?.root.message}
        </p>
      )}
      <div className="flex justify-center">
        <Button
          size="xl"
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitSuccessful}
        >
          Send reset link
        </Button>
      </div>
    </form>
  );
};

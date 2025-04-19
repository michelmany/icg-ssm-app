import { useForm } from "react-hook-form";
import { Button } from "sd-tnrsm-library";
import {
  resetPasswordSchema,
  resetPasswordSchemaValues,
} from "./reset-password-schema";
import { zodResolver } from "@hookform/resolvers/zod";

interface ResetPasswordFormProps {
  resetPassword: (values: resetPasswordSchemaValues) => Promise<void>;
}

export const ResetPasswordForm = ({
  resetPassword,
}: ResetPasswordFormProps) => {
  const { register, handleSubmit, formState, setError } =
    useForm<resetPasswordSchemaValues>({
      resolver: zodResolver(resetPasswordSchema),
    });

  const { errors, isSubmitting, isSubmitSuccessful } = formState;

  const submit = async (values: resetPasswordSchemaValues) => {
    try {
      await resetPassword(values);
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
      <p className="text-md text-green-700 text-center">
        A password reset link has been sent to your email if the account exists.
      </p>
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

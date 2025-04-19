import { useForm } from "react-hook-form";
import { Button } from "sd-tnrsm-library";
import { signInSchema, signInSchemaValues } from "./sign-in-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

interface SignInFormProps {
  signIn: (values: signInSchemaValues) => Promise<void>;
}

export const SignInForm = ({ signIn }: SignInFormProps) => {
  const { register, handleSubmit, formState, setError } =
    useForm<signInSchemaValues>({
      resolver: zodResolver(signInSchema),
    });

  const { errors, isSubmitting } = formState;

  const submit = async (values: signInSchemaValues) => {
    try {
      await signIn(values);
    } catch (e) {
      if (e instanceof Error && e.message) {
        setError("root", {
          message: e.message,
        });
      }
    }
  };

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
          <div className="text-sm">
            <Link
              href="/reset-password"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        <div className="mt-2">
          <input
            {...register("password")}
            id="password"
            type="password"
            autoComplete="current-password"
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
        {errors?.password && (
          <p className="text-red-600 text-sm mt-2">
            {errors?.password?.message}
          </p>
        )}
      </div>
      {errors?.root && (
        <p className="text-red-600 text-sm mt-2 text-center">
          {errors?.root.message}
        </p>
      )}
      <div className="flex justify-center">
        <Button size="xl" type="submit" isLoading={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    </form>
  );
};

"use client";
import { useState } from "react";
import { signInSchemaValues } from "../forms/sign-in-form/sign-in-schema";
import signInAction from "@/lib/actions/auth/sign-in";
import { SignInForm } from "../forms/sign-in-form/sign-in-form";

export const SignInPage = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSignIn = async (values: signInSchemaValues) => {
    const { success, message } = await signInAction(values);
    if (success) {
      setIsRedirecting(true);
      window.location.href = "/api/auth/login-redirect";
    } else {
      throw new Error(message);
    }
  };

  if (isRedirecting) {
    return (
      <div className="flex min-h-full flex-1 flex-col justify-center items-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Signing in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <SignInForm signIn={handleSignIn} />
      </div>
    </div>
  );
};

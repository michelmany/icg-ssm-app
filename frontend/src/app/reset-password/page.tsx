import { ConfirmResetPasswordPage } from "@/components/pages/confirm-reset-password";
import { ResetPasswordPage } from "@/components/pages/reset-password";

interface SearchParams {
  token?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function Page({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (token) {
    return <ConfirmResetPasswordPage token={token} />;
  }

  return <ResetPasswordPage />;
}

import { SchoolsAddDrawer } from "@/components/templates/schools/schools-add-drawer";

interface PageProps {
  params: Promise<{ path?: string[] }>;
}

export default async function Page({ params }: PageProps) {
  const { path } = await params;

  const open = !!path && path[0] === "add";

  if (!open) {
    return null;
  }

  return <SchoolsAddDrawer />;
}

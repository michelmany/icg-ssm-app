import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const useSetSearchParams = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { push } = useRouter();

  return (data: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    push(`${pathname}?${params.toString()}`);
  };
};

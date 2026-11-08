import { Suspense } from "react";
import { Shell, ShellCarregando } from "@/components/app/shell";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<ShellCarregando />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

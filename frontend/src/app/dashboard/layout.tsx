import { Suspense } from "react";
import { Header } from "@/components/Header";
import { DemoBanner } from "@/components/DemoBanner";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <>
      <Suspense fallback={<div className="sticky top-0 z-10 h-20 border-b border-line bg-background/90" />}>
        <Header />
      </Suspense>
      <DemoBanner />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}

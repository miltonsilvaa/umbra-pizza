import { Header } from "@/components/Header";
import { DemoBanner } from "@/components/DemoBanner";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <>
      <Header />
      <DemoBanner />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}

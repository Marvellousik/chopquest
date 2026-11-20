import { Suspense } from "react";
import KitchenGate from "@/components/cafe/KitchenGate";
import { SkeletonRows } from "@/components/cafe/bits";

// Every /kitchen/<cafeteria> page is for that cafeteria's manager only: sign in with its code first.
async function Gate({ params, children }: { params: LayoutProps<"/kitchen/[slug]">["params"]; children: React.ReactNode }) {
  const { slug } = await params;
  return <KitchenGate slug={slug}>{children}</KitchenGate>;
}

export default function KitchenCafeteriaLayout({ children, params }: LayoutProps<"/kitchen/[slug]">) {
  return (
    <Suspense fallback={<SkeletonRows n={3} label="Checking kitchen sign-in" />}>
      <Gate params={params}>{children}</Gate>
    </Suspense>
  );
}

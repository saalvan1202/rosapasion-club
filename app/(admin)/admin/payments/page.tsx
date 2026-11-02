import React, { Suspense } from "react";
import { getMembershipPayments } from "@/actions/payment";
import { PaymentManager } from "@/components/admin/payment-manager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pagos & Renovaciones (Yape / Plin) | Rosa Pasión CMS",
  description: "Aprobación de pagos directos y renovaciones de membresías",
};

export default async function AdminPaymentsPage() {
  const payments = await getMembershipPayments();

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-500">Cargando pagos...</div>}>
      <PaymentManager initialPayments={payments} />
    </Suspense>
  );
}

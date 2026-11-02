import React from "react";

export const metadata = {
  title: "Rosa Pasión Club | Beneficios y Comercios Aliados",
  description: "Portal exclusivo de socios de Rosa Pasión Club. Descuentos y beneficios en marcas aliadas.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#140306]">{children}</div>;
}

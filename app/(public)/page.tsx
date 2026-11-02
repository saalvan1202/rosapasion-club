import React from "react";
import prisma from "@/lib/prisma";
import { PortalView } from "@/components/portal/portal-view";

export const dynamic = "force-dynamic";

export default async function SocioPortalPage() {
  let categories: Array<{ id: string; name: string; slug: string; iconName: string }> = [];
  let businesses: any[] = [];
  let catalogUrl = "https://wa.me/51952226282?text=Hola%20Rosa%20Pasión,%20quiero%20ver%20su%20catálogo%20actualizado";
  let supportPhone = "51952226282";
  let dbSettings: any = null;

  try {
    const [fetchedCategories, fetchedBusinesses, fetchedSettings] = await Promise.all([
      prisma.category.findMany({
        orderBy: { order: "asc" },
      }),
      prisma.business.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          terms: {
            orderBy: { order: "asc" },
          },
        },
      }),
      prisma.clubSetting.findUnique({
        where: { id: "default" },
      }),
    ]);

    if (fetchedCategories && fetchedCategories.length > 0) {
      categories = fetchedCategories;
    }
    if (fetchedBusinesses && fetchedBusinesses.length > 0) {
      businesses = fetchedBusinesses;
    }
    if (fetchedSettings) {
      dbSettings = fetchedSettings;
      if (fetchedSettings.catalogUrl) catalogUrl = fetchedSettings.catalogUrl;
      if (fetchedSettings.supportPhone) supportPhone = fetchedSettings.supportPhone;
    }
  } catch (error) {
    console.error("Error al cargar datos del portal de socio desde DB:", error);
  }

  // Si la base de datos aún no está semillada, proveer los 7 comercios oficiales del sistema
  if (categories.length === 0) {
    categories = [
      { id: "1", name: "Lavado de Vehículos", slug: "lavado", iconName: "Car" },
      { id: "2", name: "Cafetería", slug: "cafeteria", iconName: "Coffee" },
      { id: "3", name: "Pastelería", slug: "pasteleria", iconName: "Cake" },
      { id: "4", name: "Arquitectura & Diseño", slug: "arquitectura", iconName: "Building2" },
      { id: "5", name: "Salón de Belleza", slug: "belleza", iconName: "Sparkles" },
      { id: "6", name: "Asesoría Legal", slug: "legal", iconName: "Scale" },
      { id: "7", name: "Odontología", slug: "odontologia", iconName: "HeartPulse" },
    ];
  }

  if (businesses.length === 0) {
    businesses = [
      {
        id: "master-ulala",
        name: "Master Ulala",
        slug: "master-ulala",
        discountSummary: "15% de Descuento",
        whatsappNumber: "51952226282",
        category: { id: "1", name: "Lavado de Vehículos", slug: "lavado" },
        terms: [
          { id: "t1", description: "Tarjeta personal e intransferible.", isRule: true, order: 1 },
          { id: "t2", description: "Válida únicamente durante el mes de suscripción activa de Rosa Pasión Club.", isRule: true, order: 2 },
          { id: "t3", description: "Aplica de lunes a jueves en servicios de lavado completo o premium.", isRule: true, order: 3 },
          { id: "t4", description: "Presentar la tarjeta física o código de socio antes de iniciar el servicio.", isRule: true, order: 4 },
          { id: "t5", description: "No acumulable con otras promociones o cupones vigentes.", isRule: false, order: 5 },
        ],
      },
      {
        id: "flora-cafe",
        name: "Flora Café",
        slug: "flora-cafe",
        discountSummary: "2x1 en Bebidas Especiales",
        whatsappNumber: "51952226282",
        category: { id: "2", name: "Cafetería", slug: "cafeteria" },
        terms: [
          { id: "t6", description: "Tarjeta personal del titular.", isRule: true, order: 1 },
          { id: "t7", description: "Aplica en bebidas calientes o frías de tamaño mediano (carta de autor).", isRule: true, order: 2 },
          { id: "t8", description: "Válido para consumo en salón de lunes a sábado.", isRule: true, order: 3 },
          { id: "t9", description: "Indicar membresía al solicitar la cuenta en caja.", isRule: true, order: 4 },
        ],
      },
      {
        id: "montecarlo-m",
        name: "Montecarlo M'",
        slug: "montecarlo-m",
        discountSummary: "10% en Tortas & Postres",
        whatsappNumber: "51952226282",
        category: { id: "3", name: "Pastelería", slug: "pasteleria" },
        terms: [
          { id: "t10", description: "Válido en compras mínimas de S/ 45 en tienda física.", isRule: true, order: 1 },
          { id: "t11", description: "Aplica tanto para porciones como para tortas enteras en vitrina.", isRule: true, order: 2 },
          { id: "t12", description: "En pedidos personalizados para eventos, reservar con mínimo 48 horas de anticipación.", isRule: true, order: 3 },
        ],
      },
      {
        id: "orion-arq",
        name: "ORION Arquitectura",
        slug: "orion-arq",
        discountSummary: "20% en Anteproyecto 3D",
        whatsappNumber: "51952226282",
        category: { id: "4", name: "Arquitectura & Diseño", slug: "arquitectura" },
        terms: [
          { id: "t13", description: "Aplica en la primera fase de diseño de interiores o anteproyecto residencial/comercial.", isRule: true, order: 1 },
          { id: "t14", description: "Incluye una sesión de asesoría virtual o presencial sin costo adicional.", isRule: true, order: 2 },
          { id: "t15", description: "Válido previa cita coordinada vía WhatsApp con el código de socio RPC.", isRule: true, order: 3 },
        ],
      },
      {
        id: "g-luxury-salon",
        name: "G Luxury Salon",
        slug: "g-luxury-salon",
        discountSummary: "15% en Tratamientos Capilares",
        whatsappNumber: "51952226282",
        category: { id: "5", name: "Salón de Belleza", slug: "belleza" },
        terms: [
          { id: "t16", description: "Válido de martes a viernes previa reserva de cita.", isRule: true, order: 1 },
          { id: "t17", description: "Aplica en botox capilar, alisados, hidratación profunda y corte con estilista.", isRule: true, order: 2 },
          { id: "t18", description: "Presentar tarjeta física o digital activa al momento de la cita.", isRule: true, order: 3 },
        ],
      },
      {
        id: "chopitea-falcon",
        name: "Chopitea Falcón & Asoc.",
        slug: "chopitea-falcon",
        discountSummary: "1ra Consulta Legal Gratuita",
        whatsappNumber: "51952226282",
        category: { id: "6", name: "Asesoría Legal", slug: "legal" },
        terms: [
          { id: "t19", description: "Incluye una sesión de diagnóstico legal de 45 minutos (presencial o videollamada).", isRule: true, order: 1 },
          { id: "t20", description: "Posterior a la primera consulta, se otorgará 15% de descuento en honorarios del patrocinio.", isRule: true, order: 2 },
        ],
      },
      {
        id: "buitron-dent",
        name: "Buitron Dent",
        slug: "buitron-dent",
        discountSummary: "25% en Profilaxis & Blanqueamiento",
        whatsappNumber: "51952226282",
        category: { id: "7", name: "Odontología", slug: "odontologia" },
        terms: [
          { id: "t21", description: "Evaluación inicial y diagnóstico con cámara intraoral de cortesía.", isRule: true, order: 1 },
          { id: "t22", description: "Descuento del 25% aplica en limpieza con ultrasonido (profilaxis) y blanqueamiento led.", isRule: true, order: 2 },
        ],
      },
    ];
  }

  return (
    <PortalView
      categories={categories}
      businesses={businesses}
      catalogUrl={catalogUrl}
      supportPhone={supportPhone}
      clubSettings={dbSettings ? {
        yapePhone: dbSettings.yapePhone,
        yapeName: dbSettings.yapeName,
        yapeQrUrl: dbSettings.yapeQrUrl || "/yape-qr.png",
        plinPhone: dbSettings.plinPhone || "952 226 282",
        plinQrUrl: dbSettings.plinQrUrl || "/plin-qr.png",
        bcpAccount: dbSettings.bcpAccount || "355-98231456-0-12",
        bcpCci: dbSettings.bcpCci || "002-355-009823145601-28",
        interbankAccount: dbSettings.interbankAccount || "200-3001234567",
        interbankCci: dbSettings.interbankCci || "003-200-003001234567-19",
        bbvaAccount: dbSettings.bbvaAccount || "0011-0175-0200987654",
        bbvaCci: dbSettings.bbvaCci || "011-175-000200987654-88",
        bankBeneficiary: dbSettings.bankBeneficiary || "Rosa Pasión Flores y Detalles",
        membershipPrice: dbSettings.membershipPrice ? Number(dbSettings.membershipPrice) : 29.0,
      } : undefined}
    />
  );
}

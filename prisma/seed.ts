import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de Rosa Pasión Club con catálogo oficial, miembros e historial...");

  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@rosapasion.com";
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "AdminPassword2026!";
  const adminName = process.env.DEFAULT_ADMIN_NAME || "Administrador Rosa Pasión";

  // 1. Administrador Inicial
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      name: adminName,
      role: "ADMIN",
    },
    create: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`👤 Usuario Administrador listo: ${adminUser.email}`);

  // 2. Configuración global
  const settings = await prisma.clubSetting.upsert({
    where: { id: "default" },
    update: {
      supportPhone: "51952226282",
    },
    create: {
      id: "default",
      qrRedirectUrl: "https://rosapasionclub.com",
      catalogUrl: "https://wa.me/51952226282?text=Hola%20Rosa%20Pasión,%20quiero%20ver%20su%20catálogo%20actualizado",
      supportPhone: "51952226282",
    },
  });
  console.log(`⚙️ Configuración global: WhatsApp ${settings.supportPhone}`);

  // 3. Categorías oficiales
  const categoriesData = [
    { name: "Lavado de Vehículos", slug: "lavado", iconName: "Car", order: 1 },
    { name: "Cafetería", slug: "cafeteria", iconName: "Coffee", order: 2 },
    { name: "Pastelería", slug: "pasteleria", iconName: "Cake", order: 3 },
    { name: "Arquitectura & Diseño", slug: "arquitectura", iconName: "Building2", order: 4 },
    { name: "Salón de Belleza", slug: "belleza", iconName: "Sparkles", order: 5 },
    { name: "Asesoría Legal", slug: "legal", iconName: "Scale", order: 6 },
    { name: "Odontología", slug: "odontologia", iconName: "HeartPulse", order: 7 },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, iconName: cat.iconName, order: cat.order },
      create: cat,
    });
    catMap[cat.slug] = c.id;
  }
  console.log("🏷️ 7 Categorías creadas/actualizadas exitosamente.");

  // 4. Comercios Aliados con términos y descuentos reales
  const businessesData = [
    {
      id: "master-ulala",
      slug: "master-ulala",
      name: "Master Ulala",
      categoryId: catMap["lavado"],
      discountSummary: "15% de Descuento",
      whatsappNumber: "51952226282",
      storeCode: "1001",
      validUntil: new Date("2026-11-20"),
      isActive: true,
      order: 1,
      terms: [
        "Tarjeta personal e intransferible.",
        "Válida únicamente durante el mes de suscripción activa de Rosa Pasión Club.",
        "Aplica de lunes a jueves en servicios de lavado completo o premium.",
        "Presentar la tarjeta física o código de socio antes de iniciar el servicio.",
        "No acumulable con otras promociones o cupones vigentes.",
      ],
    },
    {
      id: "flora-cafe",
      slug: "flora-cafe",
      name: "Flora Café",
      categoryId: catMap["cafeteria"],
      discountSummary: "2x1 en Bebidas Especiales",
      whatsappNumber: "51952226282",
      storeCode: "1002",
      validUntil: new Date("2026-11-20"),
      isActive: true,
      order: 2,
      terms: [
        "Tarjeta personal del titular.",
        "Aplica en bebidas calientes o frías de tamaño mediano (carta de autor).",
        "Válido para consumo en salón de lunes a sábado.",
        "Indicar membresía al solicitar la cuenta en caja.",
        "Máximo una promoción por mesa / visita.",
      ],
    },
    {
      id: "montecarlo-m",
      slug: "montecarlo-m",
      name: "Montecarlo M'",
      categoryId: catMap["pasteleria"],
      discountSummary: "10% en Tortas & Postres",
      whatsappNumber: "51952226282",
      storeCode: "1003",
      validUntil: new Date("2026-11-20"),
      isActive: true,
      order: 3,
      terms: [
        "Válido en compras mínimas de S/ 45 en tienda física.",
        "Aplica tanto para porciones como para tortas enteras en vitrina.",
        "En pedidos personalizados para eventos, reservar con mínimo 48 horas de anticipación.",
        "No aplica para costo de delivery.",
      ],
    },
    {
      id: "orion-arq",
      slug: "orion-arq",
      name: "ORION Arquitectura",
      categoryId: catMap["arquitectura"],
      discountSummary: "20% en Anteproyecto 3D",
      whatsappNumber: "51952226282",
      storeCode: "1004",
      validUntil: new Date("2026-11-20"),
      isActive: true,
      order: 4,
      terms: [
        "Aplica en la primera fase de diseño de interiores o anteproyecto residencial/comercial.",
        "Incluye una sesión de asesoría virtual o presencial sin costo adicional.",
        "Válido previa cita coordinada vía WhatsApp con el código de socio RPC.",
        "Contrato sujeto a disponibilidad de agenda del estudio.",
      ],
    },
    {
      id: "g-luxury-salon",
      slug: "g-luxury-salon",
      name: "G Luxury Salon",
      categoryId: catMap["belleza"],
      discountSummary: "15% en Tratamientos Capilares",
      whatsappNumber: "51952226282",
      storeCode: "1005",
      validUntil: new Date("2026-11-20"),
      isActive: true,
      order: 5,
      terms: [
        "Válido de martes a viernes previa reserva de cita.",
        "Aplica en botox capilar, alisados, hidratación profunda y corte con estilista.",
        "Presentar tarjeta física o digital activa al momento de la cita.",
        "No acumulable con promociones de paquetes de novias.",
      ],
    },
    {
      id: "chopitea-falcon",
      slug: "chopitea-falcon",
      name: "Chopitea Falcón & Asoc.",
      categoryId: catMap["legal"],
      discountSummary: "1ra Consulta Legal Gratuita",
      whatsappNumber: "51952226282",
      storeCode: "1006",
      validUntil: new Date("2026-11-20"),
      isActive: true,
      order: 6,
      terms: [
        "Incluye una sesión de diagnóstico legal de 45 minutos (presencial o videollamada).",
        "Posterior a la primera consulta, se otorgará 15% de descuento en honorarios del patrocinio.",
        "Sujeto a previa coordinación de agenda con el socio titular de la tarjeta RPC.",
      ],
    },
    {
      id: "buitron-dent",
      slug: "buitron-dent",
      name: "Buitron Dent",
      categoryId: catMap["odontologia"],
      discountSummary: "25% en Profilaxis & Blanqueamiento",
      whatsappNumber: "51952226282",
      storeCode: "1007",
      validUntil: new Date("2026-11-20"),
      isActive: true,
      order: 7,
      terms: [
        "Evaluación inicial y diagnóstico con cámara intraoral de cortesía.",
        "Descuento del 25% aplica en limpieza con ultrasonido (profilaxis) y blanqueamiento led.",
        "Válido para el titular de la membresía y un acompañante directo.",
        "Requiere agendamiento previo.",
      ],
    },
  ];

  for (const b of businessesData) {
    const { terms, ...bizData } = b;
    await prisma.business.upsert({
      where: { slug: bizData.slug },
      update: {
        ...bizData,
        terms: {
          deleteMany: {},
          create: terms.map((desc, idx) => ({
            description: desc,
            isRule: true,
            order: idx + 1,
          })),
        },
      },
      create: {
        ...bizData,
        terms: {
          create: terms.map((desc, idx) => ({
            description: desc,
            isRule: true,
            order: idx + 1,
          })),
        },
      },
    });
    console.log(`🏢 Marca registrada: ${bizData.name}`);
  }

  // 5. Socios Oficiales / Suscripciones de Membresía
  const member1 = await prisma.member.upsert({
    where: { code: "RPC-0001" },
    update: {
      name: "Orison David",
      documentType: "DNI",
      documentNumber: "72345678",
      email: "orisondavid@gmail.com",
      phone: "+51987654321",
      status: "ACTIVA",
      validFrom: new Date("2026-10-21"),
      validUntil: new Date("2026-11-20"),
    },
    create: {
      code: "RPC-0001",
      name: "Orison David",
      documentType: "DNI",
      documentNumber: "72345678",
      email: "orisondavid@gmail.com",
      phone: "+51987654321",
      status: "ACTIVA",
      validFrom: new Date("2026-10-21"),
      validUntil: new Date("2026-11-20"),
    },
  });

  const member2 = await prisma.member.upsert({
    where: { code: "RPC-0002" },
    update: {
      name: "Valeria Mendoza",
      documentType: "DNI",
      documentNumber: "71234567",
      email: "valeria.mendoza@outlook.com",
      phone: "+51912345678",
      status: "ACTIVA",
      validFrom: new Date("2026-10-15"),
      validUntil: new Date("2026-11-15"),
    },
    create: {
      code: "RPC-0002",
      name: "Valeria Mendoza",
      documentType: "DNI",
      documentNumber: "71234567",
      email: "valeria.mendoza@outlook.com",
      phone: "+51912345678",
      status: "ACTIVA",
      validFrom: new Date("2026-10-15"),
      validUntil: new Date("2026-11-15"),
    },
  });

  const member3 = await prisma.member.upsert({
    where: { code: "RPC-0003" },
    update: {
      name: "Carlos Gutiérrez",
      documentType: "CE",
      documentNumber: "001234567",
      email: "carlos.gutierrez@gmail.com",
      phone: "+51998877665",
      status: "VENCIDA",
      validFrom: new Date("2026-09-01"),
      validUntil: new Date("2026-10-01"),
    },
    create: {
      code: "RPC-0003",
      name: "Carlos Gutiérrez",
      documentType: "CE",
      documentNumber: "001234567",
      email: "carlos.gutierrez@gmail.com",
      phone: "+51998877665",
      status: "VENCIDA",
      validFrom: new Date("2026-09-01"),
      validUntil: new Date("2026-10-01"),
    },
  });
  console.log(`💳 Socios registrados: ${member1.code}, ${member2.code}, ${member3.code}`);

  // 6. Historial de Canjes / Beneficios Utilizados
  const countHistory = await prisma.historyLog.count();
  if (countHistory === 0) {
    const ulala = await prisma.business.findUnique({ where: { slug: "master-ulala" } });
    const cafe = await prisma.business.findUnique({ where: { slug: "flora-cafe" } });
    const monte = await prisma.business.findUnique({ where: { slug: "montecarlo-m" } });

    await prisma.historyLog.createMany({
      data: [
        {
          memberId: member1.id,
          memberCode: member1.code,
          memberName: member1.name,
          businessId: ulala?.id,
          businessName: "Master Ulala",
          discountApplied: "15% de Descuento en Lavado de Vehículos",
          notes: "Presentó carnet físico con código QR. Servicio de lavado premium completado con éxito.",
          createdAt: new Date("2026-10-21T16:30:00Z"),
        },
        {
          memberId: member1.id,
          memberCode: member1.code,
          memberName: member1.name,
          businessId: cafe?.id,
          businessName: "Flora Café",
          discountApplied: "2x1 en Bebidas Especiales",
          notes: "Consumo en salón. Promoción aplicada en 2 cafés mocha medianos.",
          createdAt: new Date("2026-10-20T11:15:00Z"),
        },
        {
          memberId: member2.id,
          memberCode: member2.code,
          memberName: member2.name,
          businessId: monte?.id,
          businessName: "Montecarlo M'",
          discountApplied: "10% en Tortas & Postres",
          notes: "Compra de torta de tres leches en tienda física.",
          createdAt: new Date("2026-10-19T18:45:00Z"),
        },
      ],
    });
    console.log("📜 Historial de canjes inicial registrado.");
  }

  console.log("✅ Seed completado con éxito: Administrador, Categorías, Marcas, Socios e Historial.");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

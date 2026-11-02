import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Limpiando base de datos para inicio limpio desde cero...");

  // 1. Eliminar historial, pagos, socios, comercios y usuarios anteriores
  await prisma.historyLog.deleteMany({});
  await prisma.membershipPayment.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.businessTerm.deleteMany({});
  await prisma.business.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✅ Datos de prueba, socios, marcas e historial eliminados.");

  // 2. Crear único Administrador solicitado
  const adminIdentifier = "rosapasionclub";
  const adminPassword = "Club2027rosa";
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.create({
    data: {
      email: adminIdentifier,
      name: "Administrador Rosa Pasión",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`👤 Usuario Administrador exclusivo creado: ${adminUser.email}`);

  // 3. Configuración global básica del Club con cuentas bancarias oficiales
  const initialBankAccounts = [
    {
      id: "bn",
      bankName: "Banco de la Nación",
      holderName: "Orison David Cometivos Rojas",
      solesAccount: "04-581-449904",
      dollarsAccount: "",
      cci: "",
    },
    {
      id: "bcp",
      bankName: "BCP",
      holderName: "Orison David Cometivos Rojas",
      solesAccount: "550-95549542-0-21",
      dollarsAccount: "550-09325458188",
      cci: "00255010932545818821",
    },
    {
      id: "interbank",
      bankName: "Interbank",
      holderName: "Orison David Cometivos Rojas",
      solesAccount: "8983150419001",
      dollarsAccount: "",
      cci: "",
    },
    {
      id: "bbva",
      bankName: "BBVA",
      holderName: "Liley Rojas Viena",
      solesAccount: "0011-0814-0203826899",
      dollarsAccount: "",
      cci: "",
    },
  ];

  await prisma.clubSetting.upsert({
    where: { id: "default" },
    update: {
      bcpAccount: "550-95549542-0-21",
      bcpCci: "00255010932545818821",
      interbankAccount: "8983150419001",
      interbankCci: "",
      bbvaAccount: "0011-0814-0203826899",
      bbvaCci: "",
      bankBeneficiary: "Orison David Cometivos Rojas",
      bankAccounts: initialBankAccounts,
    },
    create: {
      id: "default",
      qrRedirectUrl: "https://rosapasionclub.com",
      catalogUrl: "https://rosapasion.com/rosa-pasion-principal",
      supportPhone: "51952226282",
      bcpAccount: "550-95549542-0-21",
      bcpCci: "00255010932545818821",
      interbankAccount: "8983150419001",
      interbankCci: "",
      bbvaAccount: "0011-0814-0203826899",
      bbvaCci: "",
      bankBeneficiary: "Orison David Cometivos Rojas",
      bankAccounts: initialBankAccounts,
    },
  });
  console.log("⚙️ Configuración global inicializada.");

  // 4. Categorías base (listas para cuando comiences a registrar tus comercios aliados)
  const categoriesData = [
    { name: "Lavado de Vehículos", slug: "lavado", iconName: "Car", order: 1 },
    { name: "Cafetería", slug: "cafeteria", iconName: "Coffee", order: 2 },
    { name: "Pastelería", slug: "pasteleria", iconName: "Cake", order: 3 },
    { name: "Arquitectura & Diseño", slug: "arquitectura", iconName: "Building2", order: 4 },
    { name: "Salón de Belleza", slug: "belleza", iconName: "Sparkles", order: 5 },
    { name: "Asesoría Legal", slug: "legal", iconName: "Scale", order: 6 },
    { name: "Odontología", slug: "odontologia", iconName: "HeartPulse", order: 7 },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, iconName: cat.iconName, order: cat.order },
      create: cat,
    });
  }
  console.log("🏷️ Categorías base preparadas.");

  console.log("\n🚀 Base de datos 100% limpia y lista:");
  console.log("   - Comercios / Marcas aliadas: 0");
  console.log("   - Socios registrados: 0");
  console.log("   - Historial de canjes: 0");
  console.log(`   - Usuario Administrador: ${adminIdentifier}`);
  console.log(`   - Contraseña: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error("Error al ejecutar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

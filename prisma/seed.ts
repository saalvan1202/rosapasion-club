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

  // 3. Configuración global básica del Club
  await prisma.clubSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      qrRedirectUrl: "https://rosapasionclub.com",
      catalogUrl: "https://wa.me/51952226282?text=Hola%20Rosa%20Pasión,%20quiero%20ver%20su%20catálogo%20actualizado",
      supportPhone: "51952226282",
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

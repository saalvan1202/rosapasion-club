import React from "react";
import {
  Sparkles,
  Coffee,
  Utensils,
  Cake,
  Pizza,
  Wine,
  Beer,
  IceCream,
  Scissors,
  Crown,
  Flower2,
  Gift,
  HeartPulse,
  Stethoscope,
  Activity,
  Dumbbell,
  Pill,
  Eye,
  Car,
  Wrench,
  Fuel,
  Bike,
  ShoppingBag,
  Shirt,
  Gem,
  Watch,
  Tag,
  Scale,
  Building2,
  Home,
  Briefcase,
  Laptop,
  Smartphone,
  Camera,
  Palette,
  Plane,
  Hotel,
  Film,
  Music,
  PartyPopper,
  PawPrint,
  BookOpen,
  SportShoe,
  WashingMachine,
  Droplets,
  Footprints,
} from "lucide-react";

export interface CategoryIconGroup {
  group: string;
  icons: { value: string; label: string }[];
}

export const CATEGORY_ICON_GROUPS: CategoryIconGroup[] = [
  {
    group: "Calzado, Zapatillas & Lavandería",
    icons: [
      { value: "SportShoe", label: "Lavado de Zapatillas / Calzado (Sneaker Care)" },
      { value: "Footprints", label: "Cuidado de Calzado / Podología" },
      { value: "WashingMachine", label: "Lavandería & Tintorería" },
      { value: "Droplets", label: "Lavado al Seco / Cuidado Textil" },
    ],
  },
  {
    group: "Gastronomía & Bebidas",
    icons: [
      { value: "Coffee", label: "Cafetería / Coffee Shop" },
      { value: "Utensils", label: "Restaurante / Comida" },
      { value: "Cake", label: "Pastelería / Postres / Tortas" },
      { value: "Pizza", label: "Pizzería / Fast Food" },
      { value: "Wine", label: "Vinos / Bares / Licores" },
      { value: "Beer", label: "Cervecería / Pub" },
      { value: "IceCream", label: "Heladería / Dulcería" },
    ],
  },
  {
    group: "Belleza, Cuidado & Regalos",
    icons: [
      { value: "Sparkles", label: "Salón de Belleza / Spa / Estética" },
      { value: "Scissors", label: "Barbería / Peluquería" },
      { value: "Crown", label: "Lujo / Alta Estética" },
      { value: "Flower2", label: "Florería / Arreglos" },
      { value: "Gift", label: "Regalos / Sorpresas" },
    ],
  },
  {
    group: "Salud, Bienestar & Dental",
    icons: [
      { value: "HeartPulse", label: "Salud / Odontología / Clínica" },
      { value: "Stethoscope", label: "Consultorio Médico" },
      { value: "Dumbbell", label: "Gimnasio / Fitness" },
      { value: "Activity", label: "Fisioterapia / Bienestar" },
      { value: "Pill", label: "Farmacia / Suplementos" },
      { value: "Eye", label: "Óptica / Visión" },
    ],
  },
  {
    group: "Vehículos & Transporte",
    icons: [
      { value: "Car", label: "Lavado de Vehículos / Car Wash" },
      { value: "Wrench", label: "Taller Mecánico / Mantenimiento" },
      { value: "Fuel", label: "Combustible / Estación" },
      { value: "Bike", label: "Motos / Ciclismo" },
    ],
  },
  {
    group: "Moda, Joyería & Compras",
    icons: [
      { value: "ShoppingBag", label: "Boutique / Tienda / Ropa" },
      { value: "Shirt", label: "Moda / Prendas de Vestir" },
      { value: "Gem", label: "Joyería / Accesorios Finos" },
      { value: "Watch", label: "Relojería / Accesorios" },
      { value: "Tag", label: "Promociones / Descuentos" },
    ],
  },
  {
    group: "Servicios Profesionales & Hogar",
    icons: [
      { value: "Scale", label: "Asesoría Legal / Abogados" },
      { value: "Building2", label: "Arquitectura & Diseño de Interiores" },
      { value: "Home", label: "Hogar / Muebles / Inmobiliaria" },
      { value: "Briefcase", label: "Consultoría / Contabilidad" },
      { value: "Laptop", label: "Tecnología / Computadoras" },
      { value: "Smartphone", label: "Celulares / Telefonía" },
      { value: "Camera", label: "Fotografía / Filmación / Eventos" },
      { value: "Palette", label: "Arte / Decoración / Pintura" },
    ],
  },
  {
    group: "Entretenimiento, Viajes & Mascotas",
    icons: [
      { value: "Plane", label: "Agencia de Viajes / Turismo" },
      { value: "Hotel", label: "Hotel / Hospedaje" },
      { value: "PawPrint", label: "Veterinaria / Pet Shop / Mascotas" },
      { value: "PartyPopper", label: "Eventos / Fiestas / Show" },
      { value: "Music", label: "Música / Discoteca / Conciertos" },
      { value: "Film", label: "Cine / Entretenimiento" },
      { value: "BookOpen", label: "Educación / Cursos / Librería" },
    ],
  },
];

export function getCategoryIconLabel(iconValue: string | undefined | null): string {
  if (!iconValue) return "General / Estética";
  for (const group of CATEGORY_ICON_GROUPS) {
    const found = group.icons.find(
      (i) => i.value.toLowerCase() === iconValue.toLowerCase().trim()
    );
    if (found) return found.label;
  }
  return iconValue;
}

export function renderCategoryIcon(iconName: string | undefined | null, className = "w-4 h-4") {
  const name = (iconName || "Sparkles").toLowerCase().trim();
  switch (name) {
    // Calzado & Lavandería
    case "sportshoe":
    case "zapatillas":
    case "calzado":
    case "sneakers":
      return <SportShoe className={className} />;
    case "footprints":
    case "podologia":
    case "pies":
      return <Footprints className={className} />;
    case "washingmachine":
    case "lavanderia":
    case "tintoreria":
      return <WashingMachine className={className} />;
    case "droplets":
    case "lavadoseco":
      return <Droplets className={className} />;

    // Gastronomía
    case "coffee":
    case "cafeteria":
      return <Coffee className={className} />;
    case "utensils":
    case "restaurante":
      return <Utensils className={className} />;
    case "cake":
    case "pasteleria":
      return <Cake className={className} />;
    case "pizza":
      return <Pizza className={className} />;
    case "wine":
    case "bar":
      return <Wine className={className} />;
    case "beer":
    case "cerveceria":
      return <Beer className={className} />;
    case "icecream":
    case "heladeria":
      return <IceCream className={className} />;

    // Belleza & Cuidado
    case "sparkles":
    case "belleza":
      return <Sparkles className={className} />;
    case "scissors":
    case "barberia":
      return <Scissors className={className} />;
    case "crown":
    case "lujo":
      return <Crown className={className} />;
    case "flower2":
    case "floreria":
      return <Flower2 className={className} />;
    case "gift":
    case "regalos":
      return <Gift className={className} />;

    // Salud
    case "heartpulse":
    case "salud":
    case "odontologia":
      return <HeartPulse className={className} />;
    case "stethoscope":
    case "medico":
      return <Stethoscope className={className} />;
    case "dumbbell":
    case "gimnasio":
    case "gym":
      return <Dumbbell className={className} />;
    case "activity":
      return <Activity className={className} />;
    case "pill":
    case "farmacia":
      return <Pill className={className} />;
    case "eye":
    case "optica":
      return <Eye className={className} />;

    // Vehículos
    case "car":
    case "lavado":
      return <Car className={className} />;
    case "wrench":
    case "taller":
    case "mecanica":
      return <Wrench className={className} />;
    case "fuel":
    case "grifo":
      return <Fuel className={className} />;
    case "bike":
    case "motos":
      return <Bike className={className} />;

    // Moda & Compras
    case "shoppingbag":
    case "boutique":
    case "tienda":
      return <ShoppingBag className={className} />;
    case "shirt":
    case "ropa":
      return <Shirt className={className} />;
    case "gem":
    case "joyeria":
      return <Gem className={className} />;
    case "watch":
    case "relojeria":
      return <Watch className={className} />;
    case "tag":
      return <Tag className={className} />;

    // Servicios & Hogar
    case "scale":
    case "legal":
      return <Scale className={className} />;
    case "building2":
    case "building":
    case "arquitectura":
      return <Building2 className={className} />;
    case "home":
    case "inmobiliaria":
    case "muebles":
      return <Home className={className} />;
    case "briefcase":
    case "consultoria":
      return <Briefcase className={className} />;
    case "laptop":
    case "computo":
      return <Laptop className={className} />;
    case "smartphone":
    case "celulares":
      return <Smartphone className={className} />;
    case "camera":
    case "fotografia":
      return <Camera className={className} />;
    case "palette":
    case "arte":
    case "diseno":
      return <Palette className={className} />;

    // Entretenimiento & Viajes
    case "plane":
    case "viajes":
    case "turismo":
      return <Plane className={className} />;
    case "hotel":
    case "hospedaje":
      return <Hotel className={className} />;
    case "pawprint":
    case "veterinaria":
    case "mascotas":
      return <PawPrint className={className} />;
    case "partypopper":
    case "eventos":
      return <PartyPopper className={className} />;
    case "music":
    case "musica":
      return <Music className={className} />;
    case "film":
    case "cine":
      return <Film className={className} />;
    case "bookopen":
    case "educacion":
    case "libreria":
      return <BookOpen className={className} />;

    default:
      return <Sparkles className={className} />;
  }
}

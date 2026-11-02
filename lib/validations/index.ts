import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().min(1, "El usuario o correo electrónico es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const CategorySchema = z.object({
  name: z.string().min(2, "El nombre de la categoría es requerido"),
  slug: z.string().min(2, "El slug es requerido").regex(/^[a-z0-9-]+$/, "El slug debe contener solo letras minúsculas, números y guiones"),
  iconName: z.string().default("Sparkles"),
  order: z.coerce.number().default(0),
});

export type CategoryInput = z.infer<typeof CategorySchema>;

export const BusinessTermSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(3, "La descripción del término es obligatoria"),
  isRule: z.boolean().default(false),
  order: z.coerce.number().default(0),
});

export const BusinessSchema = z.object({
  name: z.string().min(2, "El nombre del comercio es requerido"),
  slug: z.string().min(2, "El slug es requerido").regex(/^[a-z0-9-]+$/, "El slug debe contener solo letras minúsculas, números y guiones"),
  categoryId: z.string().min(1, "Debe seleccionar una categoría"),
  logoUrl: z.string().optional().nullable().or(z.literal("")),
  discountSummary: z.string().min(3, "El resumen de descuento es requerido"),
  whatsappNumber: z.string().min(6, "Número de WhatsApp requerido"),
  storeCode: z.string().min(2, "El código de validación del local es requerido").default("1234"),
  validUntil: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  order: z.coerce.number().default(0),
  terms: z.array(BusinessTermSchema).optional(),
});

export type BusinessInput = z.infer<typeof BusinessSchema>;

export const BankAccountItemSchema = z.object({
  id: z.string().optional().nullable(),
  bankName: z.string().min(1, "Nombre del banco requerido"),
  holderName: z.string().min(1, "Nombre del titular requerido"),
  solesAccount: z.string().optional().nullable(),
  dollarsAccount: z.string().optional().nullable(),
  cci: z.string().optional().nullable(),
});

export type BankAccountItem = z.infer<typeof BankAccountItemSchema>;

export const ClubSettingSchema = z.object({
  qrRedirectUrl: z.string().url("Debe ser una URL válida"),
  catalogUrl: z.string().url("Debe ser una URL válida para el catálogo"),
  supportPhone: z.string().min(6, "Número de soporte requerido"),
  yapePhone: z.string().optional().default("952 226 282"),
  yapeName: z.string().optional().default("Rosa Pasión Flores y Detalles"),
  yapeQrUrl: z.string().optional().nullable(),
  plinPhone: z.string().optional().default("952 226 282"),
  plinQrUrl: z.string().optional().nullable(),
  bcpAccount: z.string().optional().nullable(),
  bcpCci: z.string().optional().nullable(),
  interbankAccount: z.string().optional().nullable(),
  interbankCci: z.string().optional().nullable(),
  bbvaAccount: z.string().optional().nullable(),
  bbvaCci: z.string().optional().nullable(),
  bankBeneficiary: z.string().optional().default("Rosa Pasión Flores y Detalles"),
  bankAccounts: z.array(BankAccountItemSchema).optional().nullable(),
  membershipPrice: z.coerce.number().optional().default(29.0),
});

export type ClubSettingInput = z.infer<typeof ClubSettingSchema>;

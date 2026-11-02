"use server";

import prisma from "@/lib/prisma";
import { comparePasswords, signToken, setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth";
import { LoginSchema } from "@/lib/validations";
import { redirect } from "next/navigation";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export async function loginAction(prevState: unknown, formData: FormData): Promise<ActionResult> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const validated = LoginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!validated.success) {
    return {
      success: false,
      message: "Datos de formulario inválidos",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validated.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return {
        success: false,
        message: "Credenciales de acceso incorrectas",
      };
    }

    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) {
      return {
        success: false,
        message: "Credenciales de acceso incorrectas",
      };
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    return {
      success: true,
      message: "Autenticación exitosa",
    };
  } catch (error) {
    console.error("Error en loginAction:", error);
    return {
      success: false,
      message: "Error de servidor al procesar el inicio de sesión",
    };
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function getCurrentAdmin() {
  const session = await getSession();
  if (!session) return null;

  try {
    return await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, role: true },
    });
  } catch {
    return null;
  }
}

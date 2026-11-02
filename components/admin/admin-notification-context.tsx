"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getPendingPaymentsList, PendingPaymentNotificationItem } from "@/actions/payment";

interface NotificationContextType {
  pendingCount: number;
  pendingPayments: PendingPaymentNotificationItem[];
  refreshCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  pendingCount: 0,
  pendingPayments: [],
  refreshCount: async () => {},
});

export function AdminNotificationProvider({
  initialCount = 0,
  initialList = [],
  children,
}: {
  initialCount?: number;
  initialList?: PendingPaymentNotificationItem[];
  children: React.ReactNode;
}) {
  const [pendingCount, setPendingCount] = useState<number>(initialCount);
  const [pendingPayments, setPendingPayments] = useState<PendingPaymentNotificationItem[]>(initialList);

  const refreshCount = useCallback(async () => {
    try {
      const list = await getPendingPaymentsList();
      setPendingPayments(list);
      setPendingCount(list.length);
    } catch {
      // Ignorar errores de sondeo en segundo plano
    }
  }, []);

  useEffect(() => {
    // Sondeo periódico cada 20 segundos para detectar nuevos pagos en tiempo real
    const interval = setInterval(refreshCount, 20000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  return (
    <NotificationContext.Provider value={{ pendingCount, pendingPayments, refreshCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useAdminNotifications() {
  return useContext(NotificationContext);
}

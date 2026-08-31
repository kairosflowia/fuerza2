"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { StatusIcon } from "./icons";

type ToastVariant = "success" | "warning" | "error" | "information";
type ToastInput = { title: string; description?: string; variant?: ToastVariant };
type ToastRecord = ToastInput & { id: string };

interface ToastContextValue {
  toasts: ToastRecord[];
  push: (toast: ToastInput) => void;
  dismiss: (id: string) => void;
}

const Context = createContext<ToastContextValue | null>(null);
const AUTO_DISMISS_MS = 5000;

/**
 * Confirmaciones breves que no interrumpen (Fase 6: "sistema de... toast").
 * Complementa, no sustituye, el <Alert> en línea que ya usan los formularios
 * con Server Actions: sirve para acciones puntuales que no recargan la
 * página (por ejemplo, una opción de un ActionMenu).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((old) => old.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((toast: ToastInput) => {
    const id = crypto.randomUUID();
    setToasts((old) => [...old, { ...toast, id }]);
    setTimeout(() => setToasts((old) => old.filter((item) => item.id !== id)), AUTO_DISMISS_MS);
  }, []);

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return (
    <Context.Provider value={value}>
      {children}
      <div className="toaster" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.variant ?? "information"}`} role="status">
            <StatusIcon className="toast__icon" />
            <div>
              <strong>{toast.title}</strong>
              {toast.description ? <p>{toast.description}</p> : null}
            </div>
            <button type="button" className="toast__close" aria-label="Cerrar" onClick={() => dismiss(toast.id)}>×</button>
          </div>
        ))}
      </div>
    </Context.Provider>
  );
}

export function useToast() {
  const context = useContext(Context);
  if (!context) throw new Error("ToastProvider missing");
  return context;
}

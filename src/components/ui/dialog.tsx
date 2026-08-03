"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "@/lib/cn";

import { Button } from "./button";
import { CloseIcon } from "./icons";

interface DialogBaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

function useNativeDialog(
  open: boolean,
  onClose: () => void,
  returnFocusRef?: RefObject<HTMLElement | null>,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
      returnFocusRef?.current?.focus();
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose, returnFocusRef]);

  return dialogRef;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  returnFocusRef,
}: DialogBaseProps) {
  const dialogRef = useNativeDialog(open, onClose, returnFocusRef);

  return (
    <dialog ref={dialogRef} className="dialog dialog--modal" aria-labelledby="modal-title">
      <div className="dialog__header">
        <h2 id="modal-title">{title}</h2>
        <Button variant="icon" aria-label="Cerrar" onClick={onClose}>
          <CloseIcon />
        </Button>
      </div>
      <div className="dialog__body">{children}</div>
      {footer ? <div className="dialog__footer">{footer}</div> : null}
    </dialog>
  );
}

interface DrawerProps extends DialogBaseProps {
  side?: "left" | "right";
  className?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  returnFocusRef,
  side = "right",
  className,
}: DrawerProps) {
  const dialogRef = useNativeDialog(open, onClose, returnFocusRef);

  return (
    <dialog
      ref={dialogRef}
      className={cn("dialog", "dialog--drawer", `dialog--${side}`, className)}
      aria-labelledby="drawer-title"
    >
      <div className="dialog__header">
        <h2 id="drawer-title">{title}</h2>
        <Button variant="icon" aria-label="Cerrar" onClick={onClose}>
          <CloseIcon />
        </Button>
      </div>
      <div className="dialog__body">{children}</div>
      {footer ? <div className="dialog__footer">{footer}</div> : null}
    </dialog>
  );
}

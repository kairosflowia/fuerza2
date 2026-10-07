"use client";

import { useActionState, useEffect, useState } from "react";

import { updateProfileAction, type AuthActionState } from "@/app/(public)/cuenta/actions";
import { EditIcon } from "@/components/ui/icons";

const initialAuthState: AuthActionState = { status: "idle" };

/** Tarjeta "Mi perfil": datos visibles y edición en el mismo sitio. */
export function ProfileForm({ fullName, phone, email, initials }: { fullName: string; phone: string; email: string; initials: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, initialAuthState);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (state.status === "success") setEditing(false);
  }, [state]);

  return (
    <section className="fz-acard" aria-labelledby="profile-title">
      <div className="fz-acard__head">
        <h2 id="profile-title" className="fz-acard__section-title">Mi perfil</h2>
        {!editing ? (
          <button type="button" className="fz-text-button fz-text-button--icon" onClick={() => setEditing(true)}>
            <EditIcon aria-hidden="true" />Editar perfil
          </button>
        ) : null}
      </div>

      {editing ? (
        <form action={action} className="fz-profile-form">
          <div className="fz-field">
            <label htmlFor="profile-name">Nombre completo</label>
            <input id="profile-name" name="full_name" defaultValue={fullName} maxLength={120} autoComplete="name" required />
          </div>
          <div className="fz-field">
            <label htmlFor="profile-phone">Teléfono <span>(opcional)</span></label>
            <input id="profile-phone" name="phone" type="tel" defaultValue={phone} maxLength={30} autoComplete="tel" />
          </div>
          <div className="fz-profile-form__actions">
            <button type="button" className="fz-btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
            <button type="submit" className="fz-btn" disabled={pending}>{pending ? "Guardando…" : "Guardar perfil"}</button>
          </div>
          {state.status === "error" ? <p className="fz-contact-form__error" role="alert">{state.message}</p> : null}
        </form>
      ) : (
        <div className="fz-profile">
          <span className="fz-avatar fz-avatar--large" aria-hidden="true">{initials}</span>
          <div>
            <p className="fz-profile__name">{fullName || "Sin nombre"}</p>
            <p>{email}</p>
            <p className="fz-profile__muted">Teléfono: {phone || "—"}</p>
            {state.status === "success" ? <p className="fz-profile__saved" role="status">{state.message}</p> : null}
          </div>
        </div>
      )}
    </section>
  );
}

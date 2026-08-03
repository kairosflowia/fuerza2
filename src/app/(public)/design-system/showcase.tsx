"use client";

import { useRef, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  Drawer,
  EmptyState,
  ErrorState,
  Input,
  Loading,
  Modal,
  PageHeader,
  Radio,
  Section,
  Select,
  Textarea,
} from "@/components/ui";

const colors = [
  ["Crema", "#F5F1E8"], ["Negro", "#000000"], ["Terracota", "#E4572E"],
  ["Amarillo", "#F2C14E"], ["Verde", "#2E7D67"], ["Azul", "#4C78A8"],
] as const;

export function DesignSystemDemo() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const modalTrigger = useRef<HTMLButtonElement>(null);
  const drawerTrigger = useRef<HTMLButtonElement>(null);

  return (
    <main id="main-content">
      <Section>
        <Container size="wide">
          <PageHeader eyebrow="Uso interno · desarrollo" title="Sistema de diseño FUERZA" description="Primitivas visuales y accesibles para construir el portal y la operativa del obrador." />

          <div className="showcase-section">
            <h2>Paleta</h2>
            <div className="color-grid">
              {colors.map(([name, value]) => (
                <div className="color-swatch" key={name}>
                  <span style={{ background: value }} aria-hidden="true" />
                  <strong>{name}</strong><code>{value}</code>
                </div>
              ))}
            </div>
          </div>

          <div className="showcase-section type-showcase">
            <h2>Tipografía</h2>
            <p className="type-display">El pan que se levanta entre dos.</p>
            <h3>Fraunces da voz a los títulos.</h3>
            <p>Inter mantiene clara la lectura, los formularios y los números operativos: 09:00–18:00.</p>
          </div>

          <div className="showcase-section">
            <h2>Acciones y etiquetas</h2>
            <div className="component-row">
              <Button>Reserva y recoge</Button><Button variant="secondary">Ver disponibilidad</Button>
              <Button variant="text">Más información</Button><Button variant="destructive">Cancelar pedido</Button>
              <Button loading loadingLabel="Reservando…">Reservar</Button><Button disabled>Desactivado</Button>
            </div>
            <div className="component-row">
              <Badge>Neutral</Badge><Badge variant="primary">Acción</Badge><Badge variant="success">Disponible</Badge>
              <Badge variant="warning">Quedan pocos</Badge><Badge variant="error">Error</Badge><Badge variant="information">Información</Badge>
            </div>
          </div>

          <div className="showcase-section showcase-grid">
            <div>
              <h2>Campos</h2>
              <div className="form-stack">
                <Input id="demo-name" label="Nombre" placeholder="Tu nombre" />
                <Input id="demo-email" label="Correo" type="email" helpText="Solo lo usaremos para avisarte sobre tu pedido." placeholder="nombre@ejemplo.es" />
                <Select id="demo-point" label="Punto de recogida" defaultValue=""><option value="" disabled>Elige un punto</option><option>Obrador</option></Select>
                <Textarea id="demo-note" label="Nota" optional rows={4} />
                <Input id="demo-error" label="Teléfono" error="El teléfono debe tener 9 dígitos." aria-invalid />
                <Checkbox id="demo-consent" label="Quiero recibir novedades" description="Puedes cambiarlo cuando quieras." />
                <fieldset className="choice-group"><legend>Formato</legend><Radio id="format-one" name="format" label="Una pieza" defaultChecked /><Radio id="format-two" name="format" label="Dos piezas" /></fieldset>
              </div>
            </div>
            <div>
              <h2>Estados</h2>
              <div className="form-stack">
                <Alert variant="success" title="Datos guardados." />
                <Alert variant="warning" title="Esta lista todavía puede cambiar.">Los pedidos siguen abiertos.</Alert>
                <Alert variant="error" title="No hemos podido completar la acción.">Vuelve a intentarlo cuando tengas conexión.</Alert>
                <Alert title="Información útil.">La disponibilidad se confirmará antes del pago.</Alert>
                <Loading />
              </div>
            </div>
          </div>

          <div className="showcase-section">
            <h2>Tarjetas, vacíos y errores</h2>
            <div className="state-grid">
              <Card><h3>Una superficie de papel</h3><p>Filete, esquinas casi rectas y ninguna sombra.</p></Card>
              <Card><EmptyState title="Todavía no hay nada reservado." description="Los pedidos aparecerán aquí cuando estén disponibles." /></Card>
              <Card><ErrorState title="Algo se nos ha roto." description="No es culpa tuya. Vuelve a intentarlo." /></Card>
            </div>
          </div>

          <div className="showcase-section">
            <h2>Capas</h2>
            <div className="component-row">
              <Button ref={modalTrigger} variant="secondary" onClick={() => setModalOpen(true)}>Abrir diálogo</Button>
              <Button ref={drawerTrigger} variant="secondary" onClick={() => setDrawerOpen(true)}>Abrir panel</Button>
            </div>
          </div>
        </Container>
      </Section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Confirmar una decisión" returnFocusRef={modalTrigger} footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Volver</Button><Button onClick={() => setModalOpen(false)}>Confirmar</Button></>}>
        <p>Los diálogos explican qué ocurrirá antes de pedir una decisión.</p>
      </Modal>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Panel lateral" returnFocusRef={drawerTrigger}>
        <p>La gaveta conserva el foco, responde a Escape y devuelve el foco al activador.</p>
      </Drawer>
    </main>
  );
}

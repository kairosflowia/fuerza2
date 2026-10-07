# FUERZA — Reconstrucción visual Web/App
## Especificación maestra para Claude Code

**Objetivo:** reconstruir la experiencia pública de FUERZA tomando como verdad visual las imágenes de `/docs/references` (o la carpeta donde se copie este pack), sin alterar la lógica de negocio ya operativa.

La reconstrucción es **visual y de experiencia**, no un rediseño de backend. Debe conservar catálogo, disponibilidad, reservas, carrito, checkout, pagos, cuentas, puntos de recogida, Plan de Pan, newsletter, PWA, SEO y demás integraciones existentes.

---

# 1. Dirección creativa

FUERZA debe percibirse como un **obrador artesanal de gama alta en España**, contemporáneo, honesto y cálido.

Palabras clave:

- artesanal
- editorial
- sofisticado
- silencioso
- humano
- premium sin lujo ostentoso
- producto protagonista
- Asturias
- masa madre
- tiempo
- proximidad
- tradición contemporánea

Evitar:

- estética SaaS
- gradientes tecnológicos
- glassmorphism
- exceso de cards
- exceso de badges
- sombras fuertes
- interfaces densas
- textos excesivamente largos
- iconografía genérica inconsistente
- fondos blancos fríos
- negro puro en grandes superficies salvo casos muy puntuales

Principio rector:

> **Más fotografía, más aire, menos UI visible.**

La interfaz debe sentirse diseñada alrededor del pan, no alrededor de componentes.

---

# 2. Jerarquía de referencias

## Referencias prioritarias

1. `ref-02-reserva-minimal-preferred.png`
   - referencia principal para densidad, aire y elegancia
   - bloques planos y suaves
   - jerarquía limpia
   - formularios y selección de fecha compactos
   - ilustración usada como apoyo, no como ruido

2. `ref-03-newsletter-footer-preferred.png`
   - referencia para newsletter, contacto y footer
   - tratamiento editorial de fotografía
   - iconos/contacto limpios
   - ilustraciones de marca al final de página

3. `ref-04-home-minimal.png`
   - referencia para Home minimalista
   - fotografía hero como protagonista
   - CTA único
   - valores resumidos

## Referencias por sección

- Home: `ref-04`, `ref-05`
- Catálogo: `ref-06`
- Producto: `ref-07`
- Reserva y recoge: `ref-02`, `ref-08`, `ref-01`
- Plan de Pan: `ref-09`
- Obrador / Nosotros: `ref-10`
- Newsletter / Contacto: `ref-03`, `ref-11`

Las referencias son **dirección visual**, no screenshots que deban copiarse píxel a píxel. La UI final debe adaptarse al contenido real y a las reglas reales del proyecto.

---

# 3. Paleta de color

Mantener la identidad FUERZA.

```css
:root {
  --bg: #F5F1E8;
  --surface: #FBF6ED;
  --surface-strong: #F1E7D8;

  --text: #11100E;
  --text-soft: #5F5A52;
  --text-muted: #8B847A;

  --terracotta: #E4572E;
  --terracotta-dark: #C84A25;
  --terracotta-soft: #F1D7CA;

  --green: #2E7D67;
  --green-soft: #DCE9E3;

  --mustard: #F2C14E;
  --mustard-soft: #F7E8B8;

  --blue: #4C78A8;
  --blue-soft: #DCE6F0;

  --border: #DDD5C9;
  --border-soft: #EAE3D8;

  --success: #2E7D67;
  --warning: #C28A24;
  --danger: #B94132;
}
```

## Uso

**Crema:** 70–80 % de la superficie total.

**Negro/charcoal:** títulos, copy principal, iconos.

**Terracota:** CTA principal, estado seleccionado, microacentos y etiquetas.

**Verde / mostaza / azul:** secundarios; principalmente ilustraciones, categorías, estados o pequeños acentos.

Nunca convertir la interfaz en un arcoíris. En una misma pantalla, el color visual dominante debe ser **crema + negro + terracota**.

---

# 4. Tipografía

Mantener la familia ya aprobada del proyecto:

## Display / editorial
**Fraunces Variable**

Usar en:

- H1
- H2
- títulos de productos
- citas editoriales
- números/precios destacados cuando encaje

Pesos recomendados:

- 500: títulos suaves
- 600: títulos principales
- 700: solo cuando sea necesario

## UI / lectura
**Inter Variable**

Usar en:

- body
- navegación
- labels
- botones
- formularios
- badges
- metadata
- ayudas

Pesos:

- 400 body
- 500 controles
- 600 CTA / labels

## Escala móvil

```css
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;

--h3: clamp(22px, 5vw, 28px);
--h2: clamp(30px, 8vw, 42px);
--h1: clamp(42px, 11vw, 64px);
```

Line-height:

- Display: 0.98–1.08
- Body: 1.45–1.60

No usar uppercase en textos largos. Uppercase solo para eyebrow, labels, pequeñas categorías y CTA.

---

# 5. Sistema de espaciado

Base: **4 px**.

```txt
4   micro
8   compacto
12  control
16  separación estándar
20  card interna
24  bloque
32  sección compacta
40  sección
48  sección grande
64  hero
80  desktop premium
```

En móvil:

- gutter lateral: 20–24 px
- distancia entre secciones: 48–64 px
- padding de card: 20–24 px
- altura táctil mínima: 44 px

No apretar contenido para “mostrar más”. La referencia visual premia el aire.

---

# 6. Radios, bordes y sombras

```css
--radius-sm: 10px;
--radius-md: 16px;
--radius-lg: 24px;
--radius-xl: 32px;
--radius-pill: 999px;
```

## Bordes

- 1px
- bajo contraste
- `var(--border-soft)`

## Sombras

Usar con extrema moderación.

```css
box-shadow: 0 8px 30px rgba(50, 30, 18, 0.07);
```

Preferir separación por:

- fondo
- espacio
- borde sutil
- fotografía

antes que por sombra.

---

# 7. Fotografía

La fotografía debe ser el elemento premium principal.

## Dirección

- luz cálida natural
- textura real
- harina, lino, madera, piedra
- primeros planos
- profundidad de campo
- manos trabajando
- pan con corteza muy visible
- miga alveolada
- ambiente de obrador real

Evitar:

- bancos de imágenes demasiado perfectos
- fondos clínicos blancos
- filtros saturados
- fotos genéricas de cafetería
- props excesivos

## Ratios

- Hero móvil: 4:5 o 3:4
- Cards: 4:3
- Producto principal: 1:1 o 4:3
- Editorial horizontal desktop: 16:9 / 3:2

Siempre `object-fit: cover`.

---

# 8. Ilustraciones

Las ilustraciones FUERZA son parte esencial de la marca.

Usarlas como:

- separadores
- explicación de pasos
- microdetalles
- valores
- footer
- empty states amigables

No usar más de 1 ilustración protagonista por viewport.

Estilo:

- línea negra
- terracota puntual
- verde/mustard en pequeñas dosis
- personajes simples
- trazo artesanal
- sin sombras 3D

---

# 9. Header público

## Móvil

Estructura:

```txt
[ menú ]      [ logo FUERZA ]      [ cuenta ] [ bolsa ]
```

Altura aproximada: 88–104 px.

Características:

- fondo crema
- logo centrado
- iconos lineales
- badge de carrito terracota
- sticky solo si no roba demasiado espacio
- al hacer scroll puede compactarse suavemente

## Desktop

Logo a la izquierda o centrado según composición.
Navegación:

- Pan
- Obrador
- Plan de Pan
- Reserva y recoge
- Dónde estamos

Acciones a la derecha:

- Cuenta
- Bolsa

No mostrar más elementos de navegación de los necesarios.

---

# 10. Home `/`

## Objetivo

Transmitir marca antes de vender.

## Orden recomendado

1. Header
2. Hero
3. 3 valores
4. Selección breve de panes
5. Obrador / historia
6. Reserva y recoge
7. Plan de Pan
8. Newsletter
9. Footer

## Hero

Debe tener:

- 1 foto excelente
- 1 eyebrow
- 1 H1
- máximo 2–3 líneas de body
- 1 CTA principal

Ejemplo de densidad:

```txt
PAN DE VERDAD

Masa madre,
tradición viva.

Pan artesano elaborado con
harinas locales y tiempo real.

[ Ver nuestros panes → ]
```

No añadir carruseles, contadores, estadísticas ni badges innecesarios.

---

# 11. Catálogo `/pan`

Referencia: `ref-06-catalog.png`

## Objetivo

Sentir una selección cuidada, no un marketplace.

## Móvil

- intro corta
- categorías horizontales
- grid 2 columnas cuando el ancho lo permita
- cards compactas

Card:

```txt
[ foto ]
Nombre
Descripción de 1 línea
Precio               [+]
```

No colocar CTA textual grande en cada card.

Estados:

- agotado
- últimas unidades
- fuera de fecha

deben ser discretos y solo aparecer si aportan información.

---

# 12. Producto `/pan/[slug]`

Referencia: `ref-07-product-detail.png`

## Orden

1. Header
2. Galería
3. Nombre + precio
4. descriptor breve
5. copy máximo 3–4 líneas
6. cantidad + CTA
7. bloque editorial corto
8. disponibilidad / recogida
9. recomendaciones

El CTA principal debe destacar claramente:

**AÑADIR AL CARRITO**

No repetir información.

---

# 13. Reserva y recoge `/reserva-y-recoge`

Referencias clave: `ref-02`, `ref-08`.

## Principio

El usuario debe comprender el flujo en menos de 5 segundos.

## Estructura

### Intro

```txt
Reserva y recoge

Tu pan favorito, listo para ti.
Más tiempo para lo importante.
```

### Pasos

1. Elige
2. Selecciona
3. Recoge

Solo icono + título + una línea.

### Selector de fecha

Máximo 4–5 fechas visibles.

Estado seleccionado: terracota.

### Franja horaria

Pills grandes y táctiles.

### Punto de recogida

Una card principal:

- foto
- nombre
- dirección
- mapa
- chevron

### CTA sticky o al final

`Continuar →`

No mostrar explicaciones largas si la regla ya está comunicada por estado o validación.

---

# 14. Plan de Pan `/plan-de-pan`

Referencia: `ref-09-plan-de-pan.png`

Debe sentirse como membresía gourmet, no como tabla SaaS.

## Orden

1. Hero
2. 3 beneficios
3. frecuencia
4. planes
5. CTA

Máximo 3 planes visibles.

Cada plan:

- nombre
- frase corta
- precio
- 2–3 beneficios
- elegir

Destacar solo uno como recomendado.

---

# 15. Obrador `/obrador` y `/nosotros`

Referencia: `ref-10-obrador-nosotros.png`

## Composición

Alternar:

- fotografía grande
- titular editorial
- párrafo corto
- ilustración
- valores

No convertir la historia en un muro de texto.

Máximo 60–75 caracteres por línea en desktop.

Valores:

- Tradición que se siente
- Ingredientes que cuentan
- Tiempo que transforma
- Comunidad que nos inspira

---

# 16. Dónde estamos `/donde-estamos`

Debe mantener datos reales de puntos de recogida.

## Pantalla

- H1 corto
- mapa o visual principal
- filtros de localidad si existen varios puntos
- cards de puntos
- horario
- dirección
- abrir mapa

No sobrecargar el mapa.

---

# 17. Newsletter / Contacto

Referencia principal: `ref-03-newsletter-footer-preferred.png`.

## Newsletter

Composición:

- foto / hero editorial
- H2
- una frase
- email
- consentimiento
- botón circular o compacto

## Contacto

Solo:

- teléfono
- email
- dirección

No crear cards gigantes para datos simples.

## Social

Usar los colores secundarios de marca de forma controlada.

---

# 18. Footer

Debe sentirse como cierre editorial.

Elementos:

- ilustración de personajes FUERZA
- links básicos
- legal
- copyright
- redes

Puede incluir paisaje/ilustración ligera, pero nunca competir con el contenido.

---

# 19. Carrito

No reconstruir la lógica.

Visualmente:

- drawer o página ligera
- producto + variante
- cantidad
- subtotal
- fecha/punto si ya fue seleccionado
- CTA checkout

No mostrar formularios antes de ser necesarios.

---

# 20. Checkout

Principio:

> mínimo de fricción.

Layout móvil:

1. resumen compacto
2. datos mínimos cliente
3. aceptación legal
4. Stripe Payment Element
5. pagar

Desktop:

2 columnas:

- izquierda: datos/pago
- derecha: resumen sticky

No introducir pasos artificiales.

---

# 21. Cuenta

Debe usar el mismo lenguaje visual, pero priorizar claridad.

Secciones:

- Pedidos
- Plan de Pan
- Perfil
- Direcciones/preferencias si existen
- Salir

No hacer que la cuenta parezca un dashboard empresarial.

---

# 22. Responsive

Diseñar mobile-first.

Breakpoints recomendados:

```txt
sm  640
md  768
lg  1024
xl  1280
2xl 1440
```

Desktop no debe ser simplemente móvil ensanchado.

### Desktop

- max-width contenido: 1240–1320 px
- hero puede usar split 45/55
- grids 3–4 columnas
- tipografía más editorial
- más espacio vertical

### Tablet

- mantener 2 columnas cuando sea natural
- touch targets igual de grandes

---

# 23. Motion

Animaciones suaves y cortas.

- hover: 120–180 ms
- entrada de módulos: 250–400 ms
- easing suave
- transform máximo 2–4 px

Permitido:

- fade
- translate pequeño
- image scale 1.02 hover
- underline animado

Evitar:

- parallax fuerte
- bounce
- animaciones infinitas
- loaders decorativos

Respetar `prefers-reduced-motion`.

---

# 24. Accesibilidad

Obligatorio:

- contraste AA
- foco visible
- navegación teclado
- labels reales
- `aria-label` en iconos
- alt text útil
- target mínimo 44x44
- no depender solo de color

---

# 25. Componentes a normalizar

Claude Code debe reutilizar/crear una pequeña capa visual coherente:

```txt
PublicHeader
MobileMenu
CartButton
SectionEyebrow
EditorialHeading
PrimaryButton
SecondaryButton
IconButton
CategoryChip
ProductCard
ProductGrid
PhotoFrame
EditorialCard
ValueItem
StepItem
DatePickerStrip
TimeSlotPicker
PickupPointCard
NewsletterForm
ContactStrip
PublicFooter
```

No crear diez variantes para cada componente.

---

# 26. Design tokens sugeridos

```css
:root {
  --page-bg: #F5F1E8;
  --surface-1: #FBF6ED;
  --surface-2: #F1E7D8;

  --ink: #11100E;
  --ink-soft: #5F5A52;
  --ink-muted: #8B847A;

  --brand: #E4572E;
  --brand-hover: #C84A25;

  --green: #2E7D67;
  --yellow: #F2C14E;
  --blue: #4C78A8;

  --line: #DDD5C9;

  --r-sm: 10px;
  --r-md: 16px;
  --r-lg: 24px;
  --r-xl: 32px;

  --container: 1280px;
}
```

---

# 27. Reglas estrictas de implementación

1. **No alterar la lógica de negocio existente.**
2. No tocar Supabase/RLS salvo necesidad real derivada de UI.
3. No cambiar Stripe ni flujo de PaymentIntent.
4. No cambiar motor de disponibilidad.
5. No alterar reglas de inventario.
6. No reescribir autenticación.
7. No introducir una nueva librería visual pesada.
8. Reutilizar componentes existentes cuando sea viable.
9. Eliminar estilos visuales antiguos solo cuando el nuevo componente ya esté operativo.
10. No duplicar lógica para conseguir el nuevo diseño.
11. Mantener PWA.
12. Mantener SEO/metadata.
13. Mantener comportamiento guest checkout.
14. Mantener responsive real.
15. Mantener contenido en español de España.

---

# 28. Secuencia recomendada de reconstrucción

## Fase UI-0 — Auditoría
Identificar:

- rutas públicas
- componentes compartidos
- tokens actuales
- imágenes actuales
- hardcodes visuales
- dependencias funcionales

No modificar todavía.

## Fase UI-1 — Tokens y shell
Implementar:

- colores
- tipografías
- spacing
- radius
- buttons
- header
- footer
- container
- headings

## Fase UI-2 — Home
Reconstruir `/` siguiendo `ref-04` y `ref-05`.

## Fase UI-3 — Catálogo
Reconstruir `/pan`.

## Fase UI-4 — Producto
Reconstruir producto individual.

## Fase UI-5 — Reserva y recoge
Reconstruir `/reserva-y-recoge` usando `ref-02` como prioridad.

## Fase UI-6 — Plan de Pan
Reconstruir `/plan-de-pan`.

## Fase UI-7 — Obrador / Nosotros
Reconstruir páginas institucionales.

## Fase UI-8 — Dónde estamos
Actualizar puntos de recogida.

## Fase UI-9 — Newsletter / Contacto / Footer
Aplicar `ref-03`.

## Fase UI-10 — Carrito y Checkout
Unificar con el mismo sistema visual.

## Fase UI-11 — Cuenta
Actualizar páginas cliente.

## Fase UI-12 — QA visual responsive
Revisar:

- 320
- 375
- 390
- 430
- 768
- 1024
- 1280+
```

---

# 29. Criterios de aceptación visual

La reconstrucción no está terminada hasta que:

- la marca se reconoce inmediatamente como FUERZA;
- la interfaz parece un obrador premium, no un template;
- hay menos densidad que en la versión anterior;
- cada viewport tiene un foco visual claro;
- fotografía y producto dominan;
- las ilustraciones complementan, no decoran por decorar;
- terracota se reserva a acciones y acentos;
- no hay CTAs compitiendo en la misma sección;
- el móvil se ve excelente antes de optimizar desktop;
- Reserva y recoge se entiende sin leer párrafos;
- catálogo parece curado;
- Plan de Pan parece producto premium;
- footer/newsletter se sienten parte de la marca;
- ninguna funcionalidad real existente se pierde.

---

# 30. Prompt maestro para Claude Code

```text
Vamos a reconstruir visualmente la web/app pública de FUERZA.

Antes de modificar código, lee completamente esta especificación y revisa las imágenes de referencia incluidas.

Objetivo:
recrear la experiencia visual de las referencias con una ejecución premium, editorial, cálida, minimalista y muy cuidada, manteniendo la identidad actual de FUERZA y toda la funcionalidad existente.

La prioridad es:
1. mobile-first;
2. fotografía protagonista;
3. menos densidad;
4. jerarquía editorial;
5. interacción simple;
6. consistencia visual entre todas las rutas.

No quiero una reinterpretación genérica.

Las referencias proporcionadas son la dirección visual oficial del nuevo frontend.

No cambies lógica de negocio, Supabase, Stripe, disponibilidad, inventario, autenticación ni flujos existentes salvo que una modificación sea estrictamente necesaria para integrar la nueva interfaz.

Trabaja por fases.

En cada fase:
- inspecciona solamente los archivos necesarios;
- reutiliza lógica y componentes existentes;
- aplica los tokens definidos;
- implementa la pantalla;
- verifica responsive;
- corrige inconsistencias visuales;
- no avances automáticamente a otra fase.

Empieza por FASE UI-0: AUDITORÍA.
Identifica las rutas y componentes que deben cambiar para ejecutar esta reconstrucción y propón el mapa exacto de archivos afectados.
No implementes todavía.
```

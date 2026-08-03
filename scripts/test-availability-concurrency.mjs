#!/usr/bin/env node
// Prueba de concurrencia real contra Supabase LOCAL. No es un mock: abre
// conexiones paralelas de verdad contra Postgres y comprueba que el motor de
// disponibilidad nunca vende más de lo que puede.
//
// Requisito explícito de la Fase 6: "não simules concorrência apenas com
// mocks" y "testes reais com PostgreSQL local". pgTAP no puede exercer esto
// porque corre en una única transacción/sesión; este script abre N conexiones
// simultáneas reales a Postgres (una por invocación de `supabase db query`),
// cada una ejecutando create_stock_reservation de verdad.
//
// Uso: npx supabase start && node scripts/test-availability-concurrency.mjs
// Nunca se ejecuta contra el proyecto remoto (lo verifica antes de empezar).

import { execFile, execFileSync, execSync } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function localApiUrl() {
  const raw = execSync("npx supabase status -o json 2>/dev/null", { encoding: "utf8" });
  return JSON.parse(raw).API_URL;
}

if (!/127\.0\.0\.1|localhost/.test(localApiUrl())) {
  console.error("Este script solo debe ejecutarse contra Supabase local. Abortando.");
  process.exit(1);
}

const ids = {
  family: "b0000000-0000-0000-0000-000000000001",
  product: "b0000000-0000-0000-0000-000000000002",
  variant: "b0000000-0000-0000-0000-000000000003",
  point: "b0000000-0000-0000-0000-000000000004",
};

function sql(statement) {
  execFileSync("npx", ["supabase", "db", "query", "--local", statement], { stdio: ["ignore", "ignore", "inherit"] });
}

async function sqlValueAsync(statement, key) {
  const { stdout } = await execFileAsync("npx", ["supabase", "db", "query", "--local", statement]);
  const parsed = JSON.parse(stdout.slice(stdout.indexOf("{")));
  return parsed.rows[0]?.[key] ?? null;
}

let failures = 0;
function assert(condition, message) {
  if (condition) {
    console.log(`  ok — ${message}`);
  } else {
    failures += 1;
    console.log(`  FALLO — ${message}`);
  }
}

function tearDown() {
  sql(`delete from public.stock_reservations where product_variant_id = '${ids.variant}';`);
  sql(`delete from public.order_items where product_variant_id = '${ids.variant}';`);
  sql(`delete from public.orders where pickup_point_id = '${ids.point}';`);
  sql(`delete from public.production_dates where product_variant_id = '${ids.variant}';`);
  sql(`delete from public.product_pickup_points where product_id = '${ids.product}';`);
  sql(`delete from public.pickup_point_capacity_defaults where pickup_point_id = '${ids.point}';`);
  sql(`delete from public.pickup_point_collection_windows where pickup_point_id = '${ids.point}';`);
  sql(`delete from public.pickup_points where id = '${ids.point}';`);
  sql(`delete from public.product_production_weekdays where product_id = '${ids.product}';`);
  sql(`delete from public.product_variants where id = '${ids.variant}';`);
  sql(`delete from public.products where id = '${ids.product}';`);
  sql(`delete from public.product_families where id = '${ids.family}';`);
}

function setUp(capacity) {
  tearDown();
  sql(`insert into public.product_families (id, name, slug, status) values ('${ids.family}', 'Familia concurrencia', 'familia-concurrencia', 'active');`);
  sql(`insert into public.products (id, family_id, name, slug, short_description, status) values ('${ids.product}', '${ids.family}', 'Producto concurrencia', 'producto-concurrencia', 'Prueba', 'draft');`);
  sql(`insert into public.product_variants (id, product_id, name, price_cents, vat_rate, status) values ('${ids.variant}', '${ids.product}', 'Única', 500, 10, 'active');`);
  sql(`update public.products set status = 'active' where id = '${ids.product}';`);
  sql(`insert into public.product_production_weekdays (product_id, weekday, is_active) select '${ids.product}', g, true from generate_series(1, 7) g;`);
  sql(`insert into public.pickup_points (id, name, slug, type, status, is_public, accepts_all_products) values ('${ids.point}', 'Punto concurrencia', 'punto-concurrencia', 'bakery', 'active', true, true);`);
  sql(`insert into public.pickup_point_collection_windows (pickup_point_id, weekday, starts_at, ends_at) select '${ids.point}', g, '09:00', '18:00' from generate_series(1, 7) g;`);
  sql(`insert into public.pickup_point_capacity_defaults (pickup_point_id, weekday, max_units) select '${ids.point}', g, 1000 from generate_series(1, 7) g;`);
  sql(`insert into public.app_settings (key, value, is_public) values ('availability.cutoff_time', '"23:59"'::jsonb, false) on conflict (key) do update set value = excluded.value;`);
  sql(`insert into public.app_settings (key, value, is_public) values ('availability.cutoff_days_before', '0'::jsonb, false) on conflict (key) do update set value = excluded.value;`);
  sql(`insert into public.app_settings (key, value, is_public) values ('availability.reservation_duration_seconds', '900'::jsonb, false) on conflict (key) do update set value = excluded.value;`);

  const productionDate = new Date();
  productionDate.setDate(productionDate.getDate() + 90);
  const dateStr = productionDate.toISOString().slice(0, 10);

  sql(`insert into public.production_dates (product_variant_id, production_date, total_capacity, status) values ('${ids.variant}', '${dateStr}', ${capacity}, 'open');`);

  return dateStr;
}

// Cada llamada abre su PROPIA conexión real a Postgres (una invocación de la
// CLI = una sesión nueva), así que ejecutar varias en paralelo con
// Promise.all es concurrencia real, no simulada, sobre la misma transacción
// que crea la reserva dentro de create_stock_reservation.
async function reserve(dateStr, quantity, sessionKey) {
  const statement = `select ok, reason from public.create_stock_reservation('${ids.variant}', '${ids.point}', '${dateStr}', ${quantity}, '${sessionKey}');`;
  const out = await execFileAsync("npx", ["supabase", "db", "query", "--local", statement]);
  const parsed = JSON.parse(out.stdout.slice(out.stdout.indexOf("{")));
  return parsed.rows[0];
}

async function activeReservedTotal() {
  return sqlValueAsync(
    `select coalesce(sum(quantity), 0)::integer as total from public.stock_reservations where product_variant_id = '${ids.variant}' and status = 'active';`,
    "total",
  );
}

async function scenarioLastUnit() {
  console.log("\nEscenario 1 — dos sesiones intentan reservar la última unidad");
  const dateStr = setUp(1);
  const results = await Promise.all([
    reserve(dateStr, 1, "concurrencia-a"),
    reserve(dateStr, 1, "concurrencia-b"),
  ]);
  const successes = results.filter((r) => r.ok);
  assert(successes.length === 1, `exactamente una de las dos reservas tiene éxito (obtenido: ${successes.length})`);
  assert(results.some((r) => !r.ok && r.reason === "sold_out"), "la reserva perdedora recibe el motivo sold_out");

  const total = await activeReservedTotal();
  assert(total === 1, `la suma reservada nunca supera la capacidad de 1 (obtenido: ${total})`);
}

async function scenarioManySessionsExceedRemaining() {
  console.log("\nEscenario 2 — tres sesiones piden más de lo que queda (capacidad 5, piden 2 cada una)");
  const dateStr = setUp(5);
  const results = await Promise.all([
    reserve(dateStr, 2, "concurrencia-c1"),
    reserve(dateStr, 2, "concurrencia-c2"),
    reserve(dateStr, 2, "concurrencia-c3"),
  ]);
  const successes = results.filter((r) => r.ok);
  assert(successes.length === 2, `exactamente dos de las tres reservas de 2 unidades caben en 5 (obtenido: ${successes.length})`);

  const total = await activeReservedTotal();
  assert(total <= 5, `la suma reservada nunca supera la capacidad de 5 (obtenido: ${total})`);
  assert(total === 4, `la suma reservada es exactamente 4 (las dos que cupieron), no negativa ni mayor que la capacidad (obtenido: ${total})`);
}

async function scenarioHighConcurrency() {
  console.log("\nEscenario 3 — veinte sesiones simultáneas para una capacidad de 3");
  const dateStr = setUp(3);
  const attempts = Array.from({ length: 20 }, (_, i) => reserve(dateStr, 1, `concurrencia-alta-${i}`));
  const results = await Promise.all(attempts);
  const successes = results.filter((r) => r.ok);
  assert(successes.length === 3, `exactamente 3 de 20 intentos simultáneos tienen éxito (obtenido: ${successes.length})`);

  const total = await activeReservedTotal();
  assert(total === 3, `la capacidad nunca queda negativa ni por encima de 3 bajo alta concurrencia (obtenido: ${total})`);
}

async function main() {
  console.log("Pruebas de concurrencia real del motor de disponibilidad (Supabase local)");
  await scenarioLastUnit();
  await scenarioManySessionsExceedRemaining();
  await scenarioHighConcurrency();
  tearDown();

  console.log("\n" + "=".repeat(60));
  if (failures === 0) {
    console.log("Todas las pruebas de concurrencia pasaron. Cero sobreventa detectada.");
    process.exit(0);
  } else {
    console.log(`${failures} prueba(s) de concurrencia fallaron.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error inesperado:", error);
  process.exit(1);
});

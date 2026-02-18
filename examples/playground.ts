/**
 * Script para probar el SDK localmente.
 * Solo ejecuta operaciones GET — seguro para usar con token de producción.
 *
 * Uso:
 *   BSALE_TOKEN=tu-token-aqui npx tsx examples/playground.ts
 */
import { BsaleClient, fromBsaleTimestamp } from '../src';

const token = process.env.BSALE_TOKEN;
if (!token) {
  console.error('Falta BSALE_TOKEN. Uso: BSALE_TOKEN=xxx npx tsx examples/playground.ts');
  process.exit(1);
}

const bsale = new BsaleClient({
  accessToken: token,
  logger: (msg, data) => console.log(`  [bsale] ${msg}`, data ?? ''),
});

async function main() {
  // ─── Productos ───
  console.log('\n=== Productos ===');
  const products = await bsale.products.list({ limit: 3, state: 0 });
  console.log(`Total: ${products.count}, mostrando ${products.items.length}:`);
  for (const p of products.items) {
    console.log(`  - [${p.id}] ${p.name} (state: ${p.state})`);
  }
  if (products.items[0]) {
    const variants = await bsale.products.getVariants(products.items[0].id, { limit: 2 });
    console.log(`  Variantes del producto ${products.items[0].id}: ${variants.count}`);
  }
  const productCount = await bsale.products.count();
  console.log(`  Count total: ${productCount.count}`);

  // ─── Variantes ───
  console.log('\n=== Variantes (primeras 3) ===');
  const variants = await bsale.variants.list({ limit: 3, state: 0 });
  console.log(`Total: ${variants.count}`);
  for (const v of variants.items) {
    console.log(`  - [${v.id}] ${v.description} | code: ${v.code} | barCode: ${v.barCode}`);
  }

  // ─── Documentos ───
  console.log('\n=== Documentos recientes (últimos 3) ===');
  const docs = await bsale.documents.list({ limit: 3 });
  for (const d of docs.items) {
    const fecha = fromBsaleTimestamp(d.emissionDate);
    console.log(`  - [${d.id}] #${d.number} | $${d.totalAmount} | ${fecha.toLocaleDateString('es-CL')}`);
  }
  if (docs.items[0]) {
    const details = (await bsale.documents.getDetails(docs.items[0].id)) as { count: number };
    console.log(`  Detalles del doc ${docs.items[0].id}: ${details.count} líneas`);
  }

  // ─── Clientes ───
  console.log('\n=== Clientes (primeros 3) ===');
  const clients = await bsale.clients.list({ limit: 3 });
  for (const c of clients.items) {
    console.log(`  - [${c.id}] ${c.firstName} ${c.lastName} | ${c.email ?? 'sin email'}`);
  }

  // ─── Listas de Precio ───
  console.log('\n=== Listas de Precio ===');
  const priceLists = await bsale.priceLists.list();
  for (const pl of priceLists.items) {
    console.log(`  - [${pl.id}] ${pl.name}`);
  }
  if (priceLists.items[0]) {
    const plDetails = await bsale.priceLists.getDetails(priceLists.items[0].id, { limit: 2 });
    console.log(`  Detalles de lista ${priceLists.items[0].id}: ${plDetails.count}`);
  }

  // ─── Stock ───
  console.log('\n=== Stock (primeros 3) ===');
  const stocks = await bsale.stocks.list({ limit: 3 });
  for (const s of stocks.items) {
    console.log(`  - variant: ${s.variant?.id} | office: ${s.office?.id} | disponible: ${s.quantityAvailable}`);
  }

  // ─── Tipos de Documento ───
  console.log('\n=== Tipos de Documento ===');
  const docTypes = await bsale.documentTypes.list();
  for (const dt of docTypes.items) {
    console.log(`  - [${dt.id}] ${dt.name} (codeSii: ${dt.codeSii})`);
  }

  // ─── Sucursales ───
  console.log('\n=== Sucursales ===');
  const offices = await bsale.offices.list();
  for (const o of offices.items) {
    console.log(`  - [${o.id}] ${o.name} (${o.address ?? 'sin dirección'})`);
  }

  // ─── Despachos ───
  console.log('\n=== Despachos (primeros 3) ===');
  const shippings = await bsale.shippings.list({ limit: 3 });
  console.log(`Total: ${shippings.count}`);
  for (const sh of shippings.items) {
    console.log(`  - [${sh.id}] ${sh.address ?? 'sin dirección'}`);
  }

  // ─── Formas de Pago ───
  console.log('\n=== Formas de Pago ===');
  const paymentTypes = await bsale.paymentTypes.list();
  for (const pt of paymentTypes.items) {
    console.log(`  - [${pt.id}] ${pt.name}`);
  }

  // ─── Recepciones de Stock ───
  console.log('\n=== Recepciones de Stock (primeras 3) ===');
  const receptions = await bsale.stockReceptions.list({ limit: 3 });
  console.log(`Total: ${receptions.count}`);
  for (const r of receptions.items) {
    console.log(`  - [${r.id}] office: ${r.office?.id ?? '?'} | note: ${r.note ?? 'sin nota'}`);
  }

  // ─── Consumos de Stock ───
  console.log('\n=== Consumos de Stock (primeros 3) ===');
  const consumptions = await bsale.stockConsumptions.list({ limit: 3 });
  console.log(`Total: ${consumptions.count}`);
  for (const c of consumptions.items) {
    console.log(`  - [${c.id}] office: ${c.office?.id ?? '?'} | note: ${c.note ?? 'sin nota'}`);
  }

  // ─── Devoluciones ───
  console.log('\n=== Devoluciones (primeras 3) ===');
  const returns = await bsale.returns.list({ limit: 3 });
  console.log(`Total: ${returns.count}`);
  for (const r of returns.items) {
    console.log(`  - [${r.id}] code: ${r.code} | monto: $${r.amount} | motivo: ${r.motive ?? '-'}`);
  }
  if (returns.items[0]) {
    const retDetails = await bsale.returns.getDetails(returns.items[0].id);
    console.log(`  Detalles de devolución ${returns.items[0].id}: ${retDetails.count} líneas`);
  }

  // ─── Documentos de Terceros ───
  console.log('\n=== Documentos de Terceros (primeros 3) ===');
  const thirdPartyDocs = await bsale.thirdPartyDocuments.list({ limit: 3 });
  console.log(`Total: ${thirdPartyDocs.count}`);
  for (const tp of thirdPartyDocs.items) {
    console.log(`  - [${tp.id}] codeSii: ${tp.codeSii} | #${tp.number} | $${tp.totalAmount}`);
  }

  // ─── Tipos de Producto ───
  console.log('\n=== Tipos de Producto ===');
  const productTypes = await bsale.productTypes.list();
  console.log(`Total: ${productTypes.count}`);
  for (const pt of productTypes.items) {
    console.log(`  - [${pt.id}] ${pt.name} (state: ${pt.state})`);
  }
  if (productTypes.items[0]) {
    const ptProducts = await bsale.productTypes.getProducts(productTypes.items[0].id, { limit: 2 });
    console.log(`  Productos del tipo ${productTypes.items[0].id}: ${ptProducts.count}`);
    const ptAttrs = await bsale.productTypes.getAttributes(productTypes.items[0].id);
    console.log(`  Atributos del tipo ${productTypes.items[0].id}: ${ptAttrs.count}`);
  }

  // ─── Usuarios ───
  console.log('\n=== Usuarios ===');
  const users = await bsale.users.list();
  console.log(`Total: ${users.count}`);
  for (const u of users.items) {
    console.log(`  - [${u.id}] ${u.firstName} ${u.lastName} | ${u.email} (state: ${u.state})`);
  }
  if (users.items[0]) {
    const summary = await bsale.users.getSalesSummary({ userid: users.items[0].id });
    console.log(`  Resumen ventas user ${users.items[0].id}:`, summary);
    const sales = await bsale.users.getSales(users.items[0].id, { limit: 2 });
    console.log(`  Ventas del user ${users.items[0].id}: ${sales.count}`);
  }

  // ─── Tipos de Despacho ───
  console.log('\n=== Tipos de Despacho ===');
  const shippingTypes = await bsale.shippingTypes.list();
  console.log(`Total: ${shippingTypes.count}`);
  for (const st of shippingTypes.items) {
    console.log(`  - [${st.id}] ${st.name} (state: ${st.state})`);
  }

  // ─── Cache demo ───
  console.log('\n=== Cache demo ===');
  console.log('Segunda llamada a products (debería ser cache hit):');
  await bsale.products.list({ limit: 3, state: 0 });

  console.log('\nLimpiando cache...');
  bsale.clearCache();
  console.log('Tercera llamada (cache miss después de clear):');
  await bsale.products.list({ limit: 3, state: 0 });

  console.log('\n✓ Todo OK — 17 resources probados');
}

main().catch((err) => {
  console.error('\n✗ Error:', err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * TASK-43 — Evidencia de las pruebas E2E en el formato del equipo.
 *
 * Lee el resultado JSON de Playwright y, por cada caso (`TC-XXX · …` con tag
 * `@US-XX`):
 *  - copia las capturas de sus pasos a `<docs>/evidencias/<US>/e2e/TC-XXX-NN.jpg`;
 *  - actualiza `<docs>/evidencias/<US>/e2e/README.md` (qué muestra cada captura);
 *  - con --registrar, agrega su fila EJ-NN a `<docs>/ejecucion.csv`.
 *
 * Uso:
 *   node scripts/evidencia-e2e.mjs [--resultados=test-results/e2e-resultados.json]
 *     [--docs=../socialclub-backend/docs/pruebas] [--registrar]
 *     [--sprint=4.0] [--ejecutor="CI (Playwright)"] [--fecha=dd/mm/aaaa]
 *
 * Sin --registrar solo copia capturas y README (útil para revisar antes).
 * El video y el trace de cada caso quedan en el reporte HTML / artifact del CI.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
} from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  }),
);
const RESULTADOS = args.resultados ?? 'test-results/e2e-resultados.json';
const DOCS = path.resolve(args.docs ?? '../socialclub-backend/docs/pruebas');
const SPRINT = args.sprint ?? '4.0';
const EJECUTOR = args.ejecutor ?? 'CI (Playwright)';
const hoy = new Date();
const FECHA =
  args.fecha ??
  `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;

if (!existsSync(RESULTADOS)) {
  console.error(`No existe ${RESULTADOS}: corré antes «npx playwright test».`);
  process.exit(1);
}
if (!existsSync(DOCS)) {
  console.error(`No existe la carpeta de documentación de pruebas: ${DOCS}`);
  process.exit(1);
}

const RESULTADO = {
  passed: 'Aprobado',
  failed: 'Fallido',
  timedOut: 'Fallido',
  skipped: 'Bloqueado',
  interrupted: 'Bloqueado',
};

/** Casos de la corrida: el último intento de cada test. */
function casos(reporte) {
  const salida = [];
  const recorrer = (suite) => {
    for (const spec of suite.specs ?? []) {
      const tc = spec.title.match(/^(TC-\d+)/)?.[1];
      const us = (spec.tags ?? [])
        .find((t) => /^US-\d+$/.test(t.replace(/^@/, '')))
        ?.replace(/^@/, '');
      if (!tc || !us) {
        console.warn(`⚠️  Sin TC o sin tag @US: «${spec.title}» (se omite)`);
        continue;
      }
      for (const test of spec.tests) {
        const r = test.results.at(-1);
        if (!r) continue;
        salida.push({
          tc,
          us,
          titulo: spec.title.replace(/^TC-\d+\s*·\s*/, ''),
          archivo: spec.file,
          estado: r.status,
          duracion: Math.round((r.duration ?? 0) / 100) / 10,
          error: r.error?.message?.split('\n')[0],
          pasos: (r.attachments ?? [])
            .filter((a) => a.name.startsWith('paso-') && a.path)
            .map((a) => ({ titulo: a.name.replace(/^paso-\d+\s*/, ''), origen: a.path })),
        });
      }
    }
    for (const hija of suite.suites ?? []) recorrer(hija);
  };
  for (const s of reporte.suites ?? []) recorrer(s);
  return salida;
}

const lista = casos(JSON.parse(readFileSync(RESULTADOS, 'utf8')));
if (!lista.length) {
  console.error('La corrida no tiene casos con «TC-XXX · …» y tag @US-XX.');
  process.exit(1);
}

// 1) Capturas + índice por US
const porUs = new Map();
for (const caso of lista) {
  const carpeta = path.join(DOCS, 'evidencias', caso.us, 'e2e');
  mkdirSync(carpeta, { recursive: true });
  caso.capturas = caso.pasos.map((p, i) => {
    const nombre = `${caso.tc}-${String(i + 1).padStart(2, '0')}${path.extname(p.origen) || '.jpg'}`;
    copyFileSync(p.origen, path.join(carpeta, nombre));
    return { archivo: nombre, titulo: p.titulo };
  });
  if (!porUs.has(caso.us)) porUs.set(caso.us, []);
  porUs.get(caso.us).push(caso);
}

for (const [us, delUs] of porUs) {
  const carpeta = path.join(DOCS, 'evidencias', us, 'e2e');
  const rutaIndice = path.join(carpeta, 'indice.json');
  const indice = existsSync(rutaIndice) ? JSON.parse(readFileSync(rutaIndice, 'utf8')) : {};
  for (const c of delUs) {
    indice[c.tc] = {
      titulo: c.titulo,
      fecha: FECHA,
      resultado: RESULTADO[c.estado] ?? c.estado,
      archivo: c.archivo,
      capturas: c.capturas,
    };
  }
  writeFileSync(rutaIndice, JSON.stringify(indice, null, 2) + '\n');

  const filas = Object.entries(indice)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tc, c]) => {
      const pasos = c.capturas
        .map((p) => `  - [\`${p.archivo}\`](${p.archivo}) — ${p.titulo}`)
        .join('\n');
      return `### ${tc} · ${c.titulo}\n\n${c.resultado} el ${c.fecha} · \`e2e/${c.archivo}\`\n\n${pasos}\n`;
    });
  writeFileSync(
    path.join(carpeta, 'README.md'),
    `# Evidencia E2E · ${us}\n\n` +
      'Capturas generadas por las pruebas E2E con Playwright (TASK-43) contra el sistema\n' +
      'real: front, API y Postgres levantados con migraciones y seed. Una captura al\n' +
      'final de cada paso del caso. El video y el trace de cada corrida quedan en el\n' +
      'reporte HTML (artifact `playwright-report` del CI).\n\n' +
      '> Generado por `socialclub-frontend/scripts/evidencia-e2e.mjs`: no editar a mano.\n\n' +
      filas.join('\n'),
  );
}

// 2) Registro de ejecución (EJ-NN)
const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
if (args.registrar) {
  const rutaCsv = path.join(DOCS, 'ejecucion.csv');
  const actual = readFileSync(rutaCsv, 'utf8');
  let ultimo = Math.max(0, ...[...actual.matchAll(/"EJ-(\d+)"/g)].map((m) => Number(m[1])));
  const filas = lista.map((c) => {
    ultimo += 1;
    const evidencia =
      `Playwright E2E (front + API + Postgres), ${c.capturas.length} paso(s): ` +
      `evidencias/${c.us}/e2e/${c.tc}-01…${String(c.capturas.length).padStart(2, '0')}${path.extname(c.capturas[0]?.archivo ?? '.jpg')}`;
    const observaciones =
      c.estado === 'passed'
        ? `Ejecución automática del flujo completo en el navegador (${c.duracion} s). Spec: e2e/${c.archivo}.`
        : `Falló: ${c.error ?? c.estado}. Ver el trace en el reporte de Playwright.`;
    return [
      `EJ-${ultimo}`,
      SPRINT,
      FECHA,
      c.tc,
      c.us,
      EJECUTOR,
      RESULTADO[c.estado] ?? 'Bloqueado',
      evidencia,
      '',
      observaciones,
    ]
      .map(csv)
      .join(',');
  });
  appendFileSync(rutaCsv, (actual.endsWith('\n') ? '' : '\n') + filas.join('\n') + '\n');
  console.log(`${filas.length} ejecución(es) agregadas a ${rutaCsv} (hasta EJ-${ultimo}).`);
}

for (const c of lista) {
  console.log(
    `${RESULTADO[c.estado] ?? c.estado} · ${c.tc} (${c.us}) · ${c.capturas.length} captura(s)`,
  );
}
console.log(`Evidencia en ${path.join(DOCS, 'evidencias')}/<US>/e2e/`);

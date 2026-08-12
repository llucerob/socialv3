// Ejecuta un archivo SQL completo (multi-sentencia) contra la base remota de Supabase.
//
// Uso:
//   npm install pg
//   node run_migracion.mjs "<CONNECTION_STRING>" 01_migracion_datos.sql
//
// CONNECTION_STRING: Supabase dashboard → Connect → "Direct connection"
//   postgresql://postgres.<ref>:<PASSWORD>@<host>:5432/postgres
import { readFileSync } from 'node:fs';
import pg from 'pg';

const [connStr, sqlFile] = process.argv.slice(2);
if (!connStr || !sqlFile) {
  console.error('Uso: node run_migracion.mjs "<CONNECTION_STRING>" <archivo.sql>');
  process.exit(1);
}

const sql = readFileSync(sqlFile, 'utf8');
const client = new pg.Client({ connectionString: connStr });

// Mostrar los RAISE NOTICE del script (los conteos de verificación)
client.on('notice', msg => console.log('  ' + (msg.message || msg)));

console.log(`Conectando... (${(sql.length/1024/1024).toFixed(1)} MB de SQL)`);
try {
  await client.connect();
  console.log('Conectado. Ejecutando migración...\n');
  const t = Date.now();
  await client.query(sql);            // protocolo simple: admite múltiples sentencias
  console.log(`\n✅ Migración completa en ${((Date.now()-t)/1000).toFixed(1)}s`);
} catch (err) {
  console.error('\n❌ Error:', err.message);
  console.error('La transacción se revirtió; no quedaron datos a medias.');
  process.exit(1);
} finally {
  await client.end();
}

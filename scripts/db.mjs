// Local PostgreSQL for development, no Docker or system install needed.
// Runs a real PostgreSQL 17 server from the embedded-postgres package.
//   npm run db            start (initialises on first run), Ctrl+C to stop
// Production should point DATABASE_URL at a managed PostgreSQL instead.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../.data/pg", import.meta.url));
const port = Number(process.env.PGPORT ?? 54329);
const user = "buntheory";
const password = "buntheory-dev";
const database = "buntheory";

// UTF-8 explicitly: on Windows initdb otherwise picks the system code page
// (e.g. WIN1252), which can't store names in Urdu, Arabic, emoji, "★"…
const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user,
  password,
  port,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: () => {},
});

const fresh = !existsSync(`${dir}/PG_VERSION`);
if (fresh) {
  console.log("Initialising local database in .data/pg …");
  await pg.initialise();
}
await pg.start();
if (fresh) {
  const client = pg.getPgClient();
  await client.connect();
  await client.query(`CREATE DATABASE ${database} TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'`);
  await client.end();
}

console.log(`PostgreSQL ready: postgresql://${user}:${password}@localhost:${port}/${database}`);
console.log("Ctrl+C to stop.");

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
// Keep the process alive while the server runs.
setInterval(() => {}, 1 << 30);

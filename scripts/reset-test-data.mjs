// Removes orders, customers, payments, reviews, notifications and subscribers
// created while testing. Catalogue, settings and staff accounts are untouched.
//   node scripts/reset-test-data.mjs --yes
import pg from "pg";
if (!process.argv.includes("--yes")) {
  console.log("This deletes ALL orders, customers, payments, reviews, notifications and subscribers. Re-run with --yes.");
  process.exit(1);
}
process.loadEnvFile(".env");
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
for (const t of ["OrderItemCustomization", "OrderItem", "Payment", "Order", "Review", "Customer", "Notification", "Subscriber"]) {
  const r = await c.query(`DELETE FROM "${t}"`);
  console.log(`${t}: ${r.rowCount} removed`);
}
await c.query(`ALTER SEQUENCE "Order_number_seq" RESTART WITH 1001`);
await c.query(`UPDATE "Coupon" SET uses = 0`);
console.log("Order numbers restart at 1001; coupon use counts reset.");
await c.end();

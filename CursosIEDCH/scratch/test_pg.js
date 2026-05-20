try {
  const pg = require('pg');
  console.log("pg is installed!");
} catch (e) {
  console.log("pg is NOT installed:", e.message);
}

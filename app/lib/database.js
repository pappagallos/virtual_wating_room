import { createPool } from "mysql2";

const pool = createPool({
  host: process.env.NEXT_PUBLIC_DB_HOST,
  user: process.env.NEXT_PUBLIC_DB_USER,
  password: process.env.NEXT_PUBLIC_DB_PASSWORD,
  database: process.env.NEXT_PUBLIC_DB_DATABASE,
  port: 3306,
});

pool.getConnection((err, conn) => {
  if (err) console.log("Error connecting to db...");
  else console.log("Connected to db...!");
  conn.release();
});

export { pool };

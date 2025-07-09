import dotenv from "dotenv"
dotenv.config()

import mysql from "mysql2/promise"

// Konfigurasi koneksi database
let dbConfig

if (process.env.DATABASE_URL) {
  // ✅ Parsing aman dari DATABASE_URL
  const dbUrl = new URL(process.env.DATABASE_URL)

  dbConfig = {
    host: dbUrl.hostname,
    port: Number(dbUrl.port || "3306"),
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace("/", ""),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "+00:00",
    connectTimeout: 10000,
    charset: "utf8mb4",
  }
} else {
  // 🔄 Fallback untuk development lokal
  dbConfig = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "al_amin_raoe_motor",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "+00:00",
    connectTimeout: 10000,
    charset: "utf8mb4",
  }
}

// Inisialisasi pool koneksi
const pool = mysql.createPool(dbConfig)

// Fungsi eksekusi query
export async function executeQuery(query: string, params: any[] = []) {
  try {
    console.log("Executing query:", query)
    console.log("With params:", params)

    const [results] = await pool.execute(query, params)
    return results
  } catch (error) {
    console.error("Database query error:", error)
    console.error("Query:", query)
    console.error("Params:", params)
    throw error
  }
}

// Fungsi mendapatkan koneksi langsung (optional)
export async function getConnection() {
  return await pool.getConnection()
}

// Fungsi untuk test koneksi
export async function testConnection() {
  try {
    const connection = await getConnection()
    await connection.ping()
    connection.release()
    console.log("✅ Database connected successfully!")
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
}

export default pool

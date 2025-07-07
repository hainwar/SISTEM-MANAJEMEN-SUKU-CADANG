import mysql from "mysql2/promise"

const dbConfig = {
  host: "127.0.0.1", // Use IPv4 explicitly to avoid IPv6 issues
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

// Create connection pool
const pool = mysql.createPool(dbConfig)

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

export async function getConnection() {
  return await pool.getConnection()
}

// Test database connection
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

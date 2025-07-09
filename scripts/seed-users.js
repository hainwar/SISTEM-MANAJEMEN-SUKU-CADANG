require("dotenv").config()
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")

async function seedUsers() {
  try {
    console.log("🌱 Seeding user accounts...")

    // Gunakan DATABASE_URL jika ada
    let connection
    if (process.env.DATABASE_URL) {
      const dbUrl = new URL(process.env.DATABASE_URL)
      const [user, password] = dbUrl.username
        ? [dbUrl.username, dbUrl.password]
        : dbUrl.auth?.split(":") ?? []

      connection = await mysql.createConnection({
        host: dbUrl.hostname,
        port: parseInt(dbUrl.port || "3306"),
        user,
        password,
        database: dbUrl.pathname.replace("/", ""),
        connectTimeout: 10000,
      })
    } else {
      connection = await mysql.createConnection({
        host: "127.0.0.1",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "al_amin_raoe_motor",
        port: Number.parseInt(process.env.DB_PORT || "3306"),
        connectTimeout: 10000,
      })
    }

    console.log("✅ Connected to database")

    const hashedPassword = await bcrypt.hash("admin123", 10)

    await connection.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(255),
    role ENUM('admin', 'gudang', 'pimpinan'),
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)


    await connection.execute(
      `
      INSERT IGNORE INTO users (username, email, password, role, full_name, is_active, created_at) VALUES 
      (?, ?, ?, ?, ?, 1, NOW())
    `,
      ["admin", "admin@alaminaroe.com", hashedPassword, "admin", "Administrator"],
    )

    await connection.end()
    console.log("🎉 Admin user created successfully!")
  } catch (error) {
    console.error("❌ Failed to seed user:", error.message)
    process.exit(1)
  }
}

seedUsers()

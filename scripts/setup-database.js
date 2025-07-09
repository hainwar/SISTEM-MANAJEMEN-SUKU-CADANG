require("dotenv").config()
const mysql = require("mysql2/promise")

async function setupDatabase() {
  try {
    console.log("🛠️ Setting up database...")

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

    // Buat struktur tabel kosong
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

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS spare_parts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50),
        name VARCHAR(100),
        category VARCHAR(100),
        brand VARCHAR(100),
        price INT,
        current_stock INT,
        minimum_stock INT,
        lead_time INT,
        rop INT,
        daily_demand FLOAT,
        location VARCHAR(100),
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('low_stock', 'reorder_point'),
        title VARCHAR(255),
        message TEXT,
        spare_part_id INT,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await connection.execute(`
  CREATE TABLE IF NOT EXISTS daily_demand_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    spare_part_id INT,
    quantity INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id)
  )
`)

await connection.execute(`
  CREATE TABLE IF NOT EXISTS stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    spare_part_id INT NOT NULL,
    type ENUM('in', 'out') NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(255),
    reference_number VARCHAR(100),
    supplier VARCHAR(100),
    unit_price INT,
    total_price INT,
    notes TEXT,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  )
`)


    await connection.end()
    console.log("✅ Database setup completed (no initial data)")
  } catch (error) {
    console.error("❌ Failed to setup database:", error.message)
    process.exit(1)
  }
}

setupDatabase()

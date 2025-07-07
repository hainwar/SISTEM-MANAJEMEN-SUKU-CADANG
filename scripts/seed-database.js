const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")

async function seedDatabase() {
  try {
    console.log("🌱 Seeding database...")

    const connection = await mysql.createConnection({
      host: "127.0.0.1",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "al_amin_raoe_motor",
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      connectTimeout: 10000,
    })

    console.log("✅ Connected to database")

    // Hash password for demo users
    const hashedPassword = await bcrypt.hash("password123", 10)

    // Insert demo users
    await connection.execute(
      `
      INSERT IGNORE INTO users (id, username, email, password, role, full_name, is_active) VALUES 
      (1, 'admin', 'admin@alaminaroe.com', ?, 'admin', 'Administrator', 1),
      (2, 'gudang1', 'gudang@alaminaroe.com', ?, 'gudang', 'Staff Gudang', 1),
      (3, 'pimpinan', 'pimpinan@alaminaroe.com', ?, 'pimpinan', 'Pimpinan', 1)
    `,
      [hashedPassword, hashedPassword, hashedPassword],
    )

    console.log("✅ Demo users created")

    // Insert demo spare parts
    const spareParts = [
      [
        "SP001",
        "Oli Mesin Yamalube 10W-40",
        "Oli & Pelumas",
        "Yamaha",
        45000,
        25,
        10,
        3,
        15,
        2.5,
        "Rak A1",
        "Oli mesin untuk motor Yamaha",
      ],
      [
        "SP002",
        "Kampas Rem Depan Vario 150",
        "Rem",
        "Honda",
        85000,
        8,
        5,
        7,
        12,
        1.2,
        "Rak B2",
        "Kampas rem depan original Honda",
      ],
      [
        "SP003",
        "Busi NGK Iridium",
        "Kelistrikan",
        "NGK",
        65000,
        3,
        8,
        5,
        10,
        1.8,
        "Rak C1",
        "Busi iridium untuk performa optimal",
      ],
      [
        "SP004",
        "Filter Udara Beat",
        "Filter",
        "Honda",
        35000,
        15,
        6,
        4,
        8,
        1.5,
        "Rak D1",
        "Filter udara original Honda Beat",
      ],
      [
        "SP005",
        "Rantai Motor 428H",
        "Transmisi",
        "DID",
        125000,
        2,
        4,
        10,
        6,
        0.8,
        "Rak E1",
        "Rantai motor kualitas premium",
      ],
    ]

    for (const part of spareParts) {
      await connection.execute(
        `
        INSERT IGNORE INTO spare_parts (
          code, name, category, brand, price, current_stock, minimum_stock, 
          lead_time, rop, daily_demand, location, description, is_active, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
      `,
        part,
      )
    }

    console.log("✅ Demo spare parts created")

    // Insert demo notifications
    await connection.execute(`
      INSERT IGNORE INTO notifications (id, type, title, message, spare_part_id, is_read, created_at) VALUES 
      (1, 'low_stock', 'Stok Rendah - Busi NGK Iridium', 'Stok busi NGK Iridium tinggal 3 unit, sudah mencapai batas minimum', 3, 0, NOW()),
      (2, 'reorder_point', 'Reorder Point - Rantai Motor 428H', 'Stok rantai motor 428H sudah mencapai reorder point, segera lakukan pemesanan', 5, 0, NOW())
    `)

    console.log("✅ Demo notifications created")

    await connection.end()
    console.log("🎉 Database seeding completed successfully!")
  } catch (error) {
    console.error("❌ Database seeding failed:", error.message)
    console.log("\n💡 Make sure database is set up first: npm run db:setup")
    process.exit(1)
  }
}

seedDatabase()

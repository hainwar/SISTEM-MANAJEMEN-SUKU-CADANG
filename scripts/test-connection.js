require("dotenv").config()
const mysql = require("mysql2/promise")

async function testConnection() {
  try {
    console.log("🔍 Testing database connection...")

    let connection

    if (process.env.DATABASE_URL) {
      console.log("🌐 Using DATABASE_URL to connect...")

      const dbUrl = new URL(process.env.DATABASE_URL)
      const [user, password] = dbUrl.username
        ? [dbUrl.username, dbUrl.password]
        : dbUrl.auth?.split(":") ?? []

      const host = dbUrl.hostname
      const port = parseInt(dbUrl.port || "3306")
      const database = dbUrl.pathname.replace("/", "")

      console.log(`Host: ${host}`)
      console.log(`Port: ${port}`)
      console.log(`User: ${user}`)
      console.log(`Database: ${database}`)

      connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database,
        connectTimeout: 10000,
      })
    } else {
      console.log("🖥️ Using local DB config...")
      const host = process.env.DB_HOST || "127.0.0.1"
      const port = parseInt(process.env.DB_PORT || "3306")
      const user = process.env.DB_USER || "root"
      const password = process.env.DB_PASSWORD || ""
      const database = process.env.DB_NAME || "al_amin_raoe_motor"

      console.log(`Host: ${host}`)
      console.log(`Port: ${port}`)
      console.log(`User: ${user}`)
      console.log(`Database: ${database}`)

      connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database,
        connectTimeout: 10000,
      })
    }

    console.log("✅ Database connected successfully!")

    // Test queries
    const [users] = await connection.execute("SELECT COUNT(*) as count FROM users")
    console.log(`👥 Users in database: ${users[0].count}`)

    const [spareParts] = await connection.execute("SELECT COUNT(*) as count FROM spare_parts")
    console.log(`📦 Spare parts in database: ${spareParts[0].count}`)

    const [notifications] = await connection.execute("SELECT COUNT(*) as count FROM notifications")
    console.log(`🔔 Notifications in database: ${notifications[0].count}`)

    const [testQuery1] = await connection.execute(
      "SELECT * FROM spare_parts WHERE is_active = 1 ORDER BY created_at DESC LIMIT 10"
    )
    console.log(`✅ LIMIT query works: ${testQuery1.length} results`)

    const [testQuery2] = await connection.execute(
      "SELECT ddl.*, sp.code as part_code FROM daily_demand_logs ddl LEFT JOIN spare_parts sp ON ddl.spare_part_id = sp.id WHERE 1=1 ORDER BY ddl.created_at DESC LIMIT 5"
    )
    console.log(`✅ Daily demand query works: ${testQuery2.length} results`)

    await connection.end()
    console.log("🎉 Database test completed successfully!")
  } catch (error) {
    console.error("❌ Database connection test failed:", error.message)
    console.log("\n💡 Troubleshooting:")
    console.log("   - MySQL server is running?")
    console.log("   - Is DATABASE_URL correct?")
    console.log("   - Cek apakah port, user, dan password cocok")
    console.log("   - Gunakan lsof -i :3306 jika lokal")
    process.exit(1)
  }
}

testConnection()

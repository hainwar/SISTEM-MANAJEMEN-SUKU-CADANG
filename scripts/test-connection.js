const mysql = require("mysql2/promise")

async function testConnection() {
  try {
    console.log("🔍 Testing database connection...")
    console.log(`Host: ${process.env.DB_HOST || "127.0.0.1"}`)
    console.log(`Port: ${process.env.DB_PORT || "3306"}`)
    console.log(`User: ${process.env.DB_USER || "root"}`)
    console.log(`Database: ${process.env.DB_NAME || "al_amin_raoe_motor"}`)

    const connection = await mysql.createConnection({
      host: "127.0.0.1", // Use IPv4 explicitly
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "al_amin_raoe_motor",
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      connectTimeout: 10000,
    })

    console.log("✅ Database connected successfully!")

    // Test queries
    const [users] = await connection.execute("SELECT COUNT(*) as count FROM users")
    console.log(`👥 Users in database: ${users[0].count}`)

    const [spareParts] = await connection.execute("SELECT COUNT(*) as count FROM spare_parts")
    console.log(`📦 Spare parts in database: ${spareParts[0].count}`)

    const [notifications] = await connection.execute("SELECT COUNT(*) as count FROM notifications")
    console.log(`🔔 Notifications in database: ${notifications[0].count}`)

    // Test problematic query
    console.log("\n🧪 Testing problematic queries...")

    const [testQuery1] = await connection.execute(
      "SELECT * FROM spare_parts WHERE is_active = 1 ORDER BY created_at DESC LIMIT 10",
    )
    console.log(`✅ LIMIT query works: ${testQuery1.length} results`)

    const [testQuery2] = await connection.execute(
      "SELECT ddl.*, sp.code as part_code FROM daily_demand_logs ddl LEFT JOIN spare_parts sp ON ddl.spare_part_id = sp.id WHERE 1=1 ORDER BY ddl.created_at DESC LIMIT 5",
    )
    console.log(`✅ Daily demand query works: ${testQuery2.length} results`)

    await connection.end()
    console.log("🎉 Database test completed successfully!")
  } catch (error) {
    console.error("❌ Database connection test failed:", error.message)
    console.log("\n💡 Troubleshooting:")
    console.log("   - MySQL server is running ✅")
    console.log("   - Check if root user needs password")
    console.log("   - Try setting DB_PASSWORD in .env.local")
    console.log("   - Make sure database exists (run: npm run db:setup)")

    if (error.code === "ECONNREFUSED") {
      console.log("   - Connection refused - check if MySQL is on port 3306")
      console.log("   - Try: lsof -i :3306 to check what's using port 3306")
    }

    process.exit(1)
  }
}

testConnection()

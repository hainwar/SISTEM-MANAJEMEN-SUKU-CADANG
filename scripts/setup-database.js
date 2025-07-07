const mysql = require("mysql2/promise")
const fs = require("fs")
const path = require("path")

async function setupDatabase() {
  try {
    console.log("🔄 Setting up database...")

    // Create connection without database first
    const connection = await mysql.createConnection({
      host: "127.0.0.1", // Use IPv4 explicitly
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      connectTimeout: 10000,
    })

    console.log("✅ Connected to MySQL server")

    // Create database if not exists
    const dbName = process.env.DB_NAME || "al_amin_raoe_motor"
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
    console.log(`✅ Database '${dbName}' created/verified`)

    // Use the database
    await connection.execute(`USE \`${dbName}\``)

    // Read and execute schema
    const schemaPath = path.join(__dirname, "database-schema.sql")
    const schema = fs.readFileSync(schemaPath, "utf8")

    // Split by semicolon and execute each statement
    const statements = schema.split(";").filter((stmt) => stmt.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement)
        } catch (error) {
          // Ignore table already exists errors
          if (!error.message.includes("already exists")) {
            console.warn("Warning:", error.message)
          }
        }
      }
    }

    console.log("✅ Database schema created")

    await connection.end()
    console.log("🎉 Database setup completed successfully!")
  } catch (error) {
    console.error("❌ Database setup failed:", error.message)
    console.log("\n💡 Troubleshooting:")
    console.log("   - Make sure MySQL server is running on port 3306")
    console.log("   - Check if password is required for root user")
    console.log("   - Try: mysql -u root -p")
    process.exit(1)
  }
}

setupDatabase()

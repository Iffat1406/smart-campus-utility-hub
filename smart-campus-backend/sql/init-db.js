#!/usr/bin/env node
/**
 * Database Initialization Script
 * Run this script to create all database tables for the Smart Campus application
 *
 * Usage: node sql/init-db.js
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config(path.join(__dirname, "../.env"));

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log("📊 Initializing Smart Campus database...\n");
    console.log("🔧 Database Configuration:");
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}\n`);

    // Test connection
    console.log("🔌 Testing database connection...");
    const result = await client.query("SELECT NOW()");
    console.log(`✅ Connection successful: ${result.rows[0].now}\n`);

    // Read schema file
    console.log("📖 Reading schema file...");
    const schemaPath = path.join(__dirname, "schema.sql");
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");
    console.log("✅ Schema file loaded\n");

    // Execute schema
    console.log("⚙️  Creating database schema...");
    await client.query(schemaSQL);
    console.log("✅ Schema created successfully\n");

    // Verify tables
    console.log("🔍 Verifying table creation...");
    const tablesQuery = `
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const tablesResult = await client.query(tablesQuery);
    const tables = tablesResult.rows.map((row) => row.table_name);

    console.log(`✅ Created ${tables.length} tables:`);
    tables.forEach((table) => {
      console.log(`   • ${table}`);
    });

    // Verify key tables exist
    console.log("\n🎯 Verifying key tables:");
    const requiredTables = [
      "notifications",
      "student_academic_progress",
      "student_gpa_history",
      "users",
      "events",
      "electives",
      "timetable_slots",
    ];

    for (const table of requiredTables) {
      if (tables.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} (MISSING!)`);
      }
    }

    console.log("\n✨ Database initialization completed successfully!\n");
    console.log("📝 Next steps:");
    console.log("   1. Run: node sql/migrate-academic-progress.js");
    console.log("   2. Start backend: npm run dev");
    console.log("   3. Start frontend: npm run dev");
    console.log("   4. Access at: http://localhost:5173\n");
  } catch (error) {
    console.error("\n❌ Error initializing database:");
    console.error(`   ${error.message}\n`);

    if (error.code === "ENOTDIR" || error.code === "ENOENT") {
      console.error(
        "   - Schema file not found. Make sure you're in the backend directory.",
      );
    } else if (error.code === "ECONNREFUSED") {
      console.error("   - PostgreSQL server is not running.");
      console.error("     Windows: net start PostgreSQL14");
      console.error("     Mac: brew services start postgresql");
      console.error("     Linux: sudo systemctl start postgresql");
    } else if (error.code === "3D000") {
      console.error("   - Database does not exist.");
      console.error(`     Create it first: createdb ${process.env.DB_NAME}`);
    } else if (error.code === "28P01" || error.code === "28000") {
      console.error("   - Authentication failed. Check DB credentials in .env");
    }

    console.error();
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run initialization
initializeDatabase().catch((err) => {
  process.exit(1);
});

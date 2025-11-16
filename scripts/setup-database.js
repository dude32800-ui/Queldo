const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

async function setupDatabase() {
  console.log('🚀 Setting up Queldo database...\n')

  // First, connect to default postgres database to create our database
  const adminPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Connect to default database first
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  })

  const dbName = process.env.DB_NAME || 'queldo'

  try {
    // Check if database exists
    console.log(`📦 Checking if database '${dbName}' exists...`)
    const dbCheck = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    )

    if (dbCheck.rows.length === 0) {
      console.log(`✨ Creating database '${dbName}'...`)
      await adminPool.query(`CREATE DATABASE ${dbName}`)
      console.log(`✅ Database '${dbName}' created successfully!\n`)
    } else {
      console.log(`✅ Database '${dbName}' already exists.\n`)
    }

    await adminPool.end()

    // Now connect to our database and run schema
    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    })

    console.log('📄 Reading schema file...')
    const schemaPath = path.join(__dirname, '..', 'server', 'database', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    console.log('🔧 Running schema...')
    await pool.query(schema)
    console.log('✅ Schema executed successfully!\n')

    // Verify tables were created
    console.log('🔍 Verifying tables...')
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    console.log(`✅ Found ${tables.rows.length} tables:`)
    tables.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`)
    })

    await pool.end()
    console.log('\n🎉 Database setup complete!')
    console.log('\nYou can now start the server with: npm run server')

  } catch (error) {
    console.error('\n❌ Error setting up database:')
    console.error(error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure PostgreSQL is running!')
      console.error('   On Windows, check Services or run: pg_ctl start')
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed. Check your DB_PASSWORD in .env file')
    } else if (error.code === '3D000') {
      console.error('\n💡 Database does not exist and could not be created.')
      console.error('   Make sure you have permission to create databases.')
    }
    
    process.exit(1)
  }
}

setupDatabase()


const { Pool } = require('pg')
require('dotenv').config()

async function checkPostgres() {
  console.log('🔍 Checking PostgreSQL connection...\n')

  const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Try connecting to default database first
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  }

  const pool = new Pool(config)

  try {
    console.log(`Attempting to connect to PostgreSQL...`)
    console.log(`Host: ${config.host}`)
    console.log(`Port: ${config.port}`)
    console.log(`User: ${config.user}\n`)

    const result = await pool.query('SELECT version()')
    console.log('✅ PostgreSQL connection successful!')
    console.log(`📊 Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`)

    // Check if queldo database exists
    const dbName = process.env.DB_NAME || 'queldo'
    const dbCheck = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    )

    if (dbCheck.rows.length > 0) {
      console.log(`✅ Database '${dbName}' exists`)
      
      // Check tables
      const queldoPool = new Pool({ ...config, database: dbName })
      const tables = await queldoPool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `)
      
      if (tables.rows.length > 0) {
        console.log(`✅ Found ${tables.rows.length} tables in database`)
      } else {
        console.log(`⚠️  Database exists but no tables found. Run: npm run setup-db`)
      }
      await queldoPool.end()
    } else {
      console.log(`⚠️  Database '${dbName}' does not exist. Run: npm run setup-db`)
    }

    await pool.end()
    process.exit(0)

  } catch (error) {
    console.error('\n❌ PostgreSQL connection failed!\n')
    console.error(`Error: ${error.message}\n`)

    if (error.code === 'ECONNREFUSED') {
      console.error('💡 PostgreSQL is not running or not accessible.')
      console.error('   Solutions:')
      console.error('   1. Start PostgreSQL service (Services → postgresql)')
      console.error('   2. Check if PostgreSQL is installed')
      console.error('   3. Verify host and port in .env file')
    } else if (error.code === '28P01') {
      console.error('💡 Authentication failed.')
      console.error('   Solutions:')
      console.error('   1. Check DB_USER and DB_PASSWORD in .env file')
      console.error('   2. Verify PostgreSQL user credentials')
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Host not found.')
      console.error('   Check DB_HOST in .env file')
    }

    process.exit(1)
  }
}

checkPostgres()


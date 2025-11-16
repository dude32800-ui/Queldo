const { Pool } = require('pg')
require('dotenv').config()

async function clearDatabase() {
  console.log('🗑️  Clearing all data from Queldo database...\n')

  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'queldo',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  })

  try {
    // Get all table names
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    const tables = tablesResult.rows.map(row => row.table_name)
    
    if (tables.length === 0) {
      console.log('✅ No tables found. Database is already empty.\n')
      await pool.end()
      return
    }

    console.log(`📋 Found ${tables.length} tables to clear:`)
    tables.forEach(table => console.log(`   - ${table}`))
    console.log()

    // Disable foreign key checks temporarily by using TRUNCATE CASCADE
    // This will delete all data and handle foreign key relationships
    console.log('🧹 Truncating all tables...')
    
    // Build TRUNCATE statement dynamically from existing tables
    // TRUNCATE CASCADE will delete all data and respect foreign key constraints
    const tableList = tables.map(table => `"${table}"`).join(', ')
    await pool.query(`
      TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE
    `)

    console.log('✅ All tables cleared successfully!\n')

    // Re-insert default badges (if badges table exists)
    if (tables.includes('badges')) {
      console.log('🏆 Re-inserting default badges...')
      try {
        await pool.query(`
          INSERT INTO badges (name, description, icon) VALUES
            ('First Trade', 'Completed your first skill trade', '🎯'),
            ('Mentor', 'Helped 10+ students learn new skills', '👨‍🏫'),
            ('Collaborator', 'Completed 5+ successful trades', '🤝'),
            ('Expert', 'Verified expert in 3+ skills', '⭐'),
            ('Community Builder', 'Active member for 30+ days', '🏗️')
          ON CONFLICT (name) DO NOTHING
        `)
        console.log('✅ Default badges restored!\n')
      } catch (err) {
        console.log('⚠️  Could not restore badges:', err.message, '\n')
      }
    }

    // Re-insert default skills (if skills table exists)
    if (tables.includes('skills')) {
      console.log('💼 Re-inserting default skills...')
      try {
        await pool.query(`
          INSERT INTO skills (name, category) VALUES
            ('Web Development', 'Programming'),
            ('JavaScript', 'Programming'),
            ('Python', 'Programming'),
            ('Graphic Design', 'Design'),
            ('UI/UX Design', 'Design'),
            ('Digital Art', 'Art'),
            ('Illustration', 'Art'),
            ('Music Production', 'Music'),
            ('Video Editing', 'Media'),
            ('Photography', 'Media'),
            ('Writing', 'Content'),
            ('Data Science', 'Programming')
          ON CONFLICT (name) DO NOTHING
        `)
        console.log('✅ Default skills restored!\n')
      } catch (err) {
        console.log('⚠️  Could not restore skills:', err.message, '\n')
      }
    }

    // Verify deletion
    console.log('📊 Database status:')
    
    // Check each table that exists
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM "${table}"`)
        console.log(`   ${table}: ${result.rows[0].count}`)
      } catch (err) {
        // Skip if table doesn't exist or was already deleted
      }
    }
    console.log()

    console.log('✨ Database cleared successfully!')
    console.log('   All user data has been removed.')
    console.log('   Default badges and skills have been restored.\n')

  } catch (error) {
    console.error('❌ Error clearing database:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run the script
clearDatabase()


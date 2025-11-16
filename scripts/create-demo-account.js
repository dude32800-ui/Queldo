const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const DEMO_EMAIL = 'demo@queldo.app'
const DEMO_PASSWORD = 'demo123'

async function createDemoAccount() {
  console.log('👤 Creating demo account for Queldo...\n')

  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'queldo',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  })

  try {
    // Check if demo user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [DEMO_EMAIL]
    )

    if (existingUser.rows.length > 0) {
      console.log('⚠️  Demo account already exists!')
      console.log(`   Email: ${DEMO_EMAIL}`)
      console.log(`   Password: ${DEMO_PASSWORD}\n`)
      console.log('💡 To recreate the demo account, delete it first or run clear-db\n')
      await pool.end()
      return
    }

    // Hash password
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

    // Create demo user
    console.log('🔨 Creating demo user...')
    const userResult = await pool.query(`
      INSERT INTO users (name, email, password_hash, age, avatar, level)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, ['Demo User', DEMO_EMAIL, passwordHash, 16, 'DU', 3])

    const userId = userResult.rows[0].id
    console.log(`✅ Demo user created (ID: ${userId})`)

    // Get skill IDs
    const skillsResult = await pool.query('SELECT id, name FROM skills')
    const skillIds = {}
    skillsResult.rows.forEach(row => {
      skillIds[row.name] = row.id
    })

    // Add skills (if user_skills table exists)
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `)
    const tables = tablesResult.rows.map(row => row.table_name)

    if (tables.includes('user_skills') && Object.keys(skillIds).length > 0) {
      console.log('💼 Adding skills to demo account...')
      const skillsToAdd = [
        { name: 'JavaScript', type: 'offering', level: 'Intermediate' },
        { name: 'Web Development', type: 'offering', level: 'Intermediate' },
        { name: 'Graphic Design', type: 'offering', level: 'Beginner' },
        { name: 'Python', type: 'seeking', level: 'Beginner' },
        { name: 'Data Science', type: 'seeking', level: 'Beginner' },
      ]

      for (const skill of skillsToAdd) {
        if (skillIds[skill.name]) {
          await pool.query(`
            INSERT INTO user_skills (user_id, skill_id, skill_type, level)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, skill_id, skill_type) DO NOTHING
          `, [userId, skillIds[skill.name], skill.type, skill.level])
        }
      }
      console.log('✅ Skills added')
    }

    // Add portfolio links
    if (tables.includes('portfolio_links')) {
      console.log('🔗 Adding portfolio links...')
      await pool.query(`
        INSERT INTO portfolio_links (user_id, title, url, platform)
        VALUES
          ($1, 'GitHub Portfolio', 'https://github.com/demouser', 'GitHub'),
          ($1, 'Personal Website', 'https://demouser.dev', 'Website'),
          ($1, 'Behance Portfolio', 'https://behance.net/demouser', 'Behance')
      `, [userId])
      console.log('✅ Portfolio links added')
    }

    // Add a sample listing
    if (tables.includes('listings')) {
      console.log('📋 Creating sample listing...')
      const listingResult = await pool.query(`
        INSERT INTO listings (user_id, title, description, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        userId,
        'Looking to learn Python! Offering Web Development in return',
        'I\'m interested in learning Python programming and can help with JavaScript and Web Development in exchange. Let\'s learn together!',
        'open'
      ])

      const listingId = listingResult.rows[0].id

      // Add skills to listing
      if (tables.includes('listing_skills_offering') && skillIds['JavaScript']) {
        await pool.query(`
          INSERT INTO listing_skills_offering (listing_id, skill_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [listingId, skillIds['JavaScript']])
      }

      if (tables.includes('listing_skills_offering') && skillIds['Web Development']) {
        await pool.query(`
          INSERT INTO listing_skills_offering (listing_id, skill_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [listingId, skillIds['Web Development']])
      }

      if (tables.includes('listing_skills_seeking') && skillIds['Python']) {
        await pool.query(`
          INSERT INTO listing_skills_seeking (listing_id, skill_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [listingId, skillIds['Python']])
      }

      console.log('✅ Sample listing created')
    }

    // Add a badge
    if (tables.includes('user_badges') && tables.includes('badges')) {
      console.log('🏆 Adding badge...')
      const badgeResult = await pool.query(
        "SELECT id FROM badges WHERE name = 'Community Builder' LIMIT 1"
      )
      if (badgeResult.rows.length > 0) {
        await pool.query(`
          INSERT INTO user_badges (user_id, badge_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, badge_id) DO NOTHING
        `, [userId, badgeResult.rows[0].id])
        console.log('✅ Badge added')
      }
    }

    console.log('\n✨ Demo account created successfully!')
    console.log('\n📧 Demo Credentials:')
    console.log(`   Email: ${DEMO_EMAIL}`)
    console.log(`   Password: ${DEMO_PASSWORD}\n`)
    console.log('💡 You can now use these credentials to log in and test features!\n')

  } catch (error) {
    console.error('❌ Error creating demo account:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run the script
createDemoAccount()


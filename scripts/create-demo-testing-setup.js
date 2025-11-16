const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const DEMO1_EMAIL = 'demo@queldo.app'
const DEMO1_PASSWORD = 'demo123'
const DEMO2_EMAIL = 'demo2@queldo.app'
const DEMO2_PASSWORD = 'demo123'

async function createDemoTestingSetup() {
  console.log('🎯 Creating demo testing setup for Queldo...\n')

  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'queldo',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  })

  try {
    // Get skill IDs
    const skillsResult = await pool.query('SELECT id, name FROM skills')
    const skillIds = {}
    skillsResult.rows.forEach(row => {
      skillIds[row.name] = row.id
    })

    // Get table names
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `)
    const tables = tablesResult.rows.map(row => row.table_name)

    // Check/create Demo User 1
    let demo1Result = await pool.query('SELECT id FROM users WHERE email = $1', [DEMO1_EMAIL])
    let demo1Id

    if (demo1Result.rows.length === 0) {
      console.log('👤 Creating Demo User 1...')
      const passwordHash = await bcrypt.hash(DEMO1_PASSWORD, 10)
      const userResult = await pool.query(`
        INSERT INTO users (name, email, password_hash, age, avatar, level)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, ['Demo User', DEMO1_EMAIL, passwordHash, 16, 'DU', 3])
      demo1Id = userResult.rows[0].id
      console.log(`✅ Demo User 1 created (ID: ${demo1Id})`)
    } else {
      demo1Id = demo1Result.rows[0].id
      console.log(`✅ Demo User 1 already exists (ID: ${demo1Id})`)
    }

    // Check/create Demo User 2
    let demo2Result = await pool.query('SELECT id FROM users WHERE email = $1', [DEMO2_EMAIL])
    let demo2Id

    if (demo2Result.rows.length === 0) {
      console.log('👤 Creating Demo User 2...')
      const passwordHash = await bcrypt.hash(DEMO2_PASSWORD, 10)
      const userResult = await pool.query(`
        INSERT INTO users (name, email, password_hash, age, avatar, level)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, ['Demo Partner', DEMO2_EMAIL, passwordHash, 17, 'DP', 2])
      demo2Id = userResult.rows[0].id
      console.log(`✅ Demo User 2 created (ID: ${demo2Id})`)
    } else {
      demo2Id = demo2Result.rows[0].id
      console.log(`✅ Demo User 2 already exists (ID: ${demo2Id})`)
    }

    // Add skills to Demo User 1
    if (tables.includes('user_skills') && Object.keys(skillIds).length > 0) {
      console.log('💼 Adding skills to Demo User 1...')
      const skillsToAdd1 = [
        { name: 'JavaScript', type: 'offering', level: 'Intermediate' },
        { name: 'Web Development', type: 'offering', level: 'Intermediate' },
        { name: 'Graphic Design', type: 'offering', level: 'Beginner' },
        { name: 'Python', type: 'seeking', level: 'Beginner' },
        { name: 'Data Science', type: 'seeking', level: 'Beginner' },
      ]

      for (const skill of skillsToAdd1) {
        if (skillIds[skill.name]) {
          await pool.query(`
            INSERT INTO user_skills (user_id, skill_id, skill_type, level)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, skill_id, skill_type) DO NOTHING
          `, [demo1Id, skillIds[skill.name], skill.type, skill.level])
        }
      }
      console.log('✅ Skills added to Demo User 1')
    }

    // Add skills to Demo User 2
    if (tables.includes('user_skills') && Object.keys(skillIds).length > 0) {
      console.log('💼 Adding skills to Demo User 2...')
      const skillsToAdd2 = [
        { name: 'Python', type: 'offering', level: 'Intermediate' },
        { name: 'Data Science', type: 'offering', level: 'Intermediate' },
        { name: 'JavaScript', type: 'seeking', level: 'Beginner' },
        { name: 'Web Development', type: 'seeking', level: 'Beginner' },
      ]

      for (const skill of skillsToAdd2) {
        if (skillIds[skill.name]) {
          await pool.query(`
            INSERT INTO user_skills (user_id, skill_id, skill_type, level)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, skill_id, skill_type) DO NOTHING
          `, [demo2Id, skillIds[skill.name], skill.type, skill.level])
        }
      }
      console.log('✅ Skills added to Demo User 2')
    }

    // Create a demo listing from Demo User 2
    if (tables.includes('listings')) {
      console.log('📋 Creating demo listing from Demo User 2...')
      
      // Check if listing already exists
      const existingListing = await pool.query(`
        SELECT id FROM listings WHERE user_id = $1 AND title LIKE '%Python%' LIMIT 1
      `, [demo2Id])

      let listingId
      if (existingListing.rows.length === 0) {
        const listingResult = await pool.query(`
          INSERT INTO listings (user_id, title, description, status)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [
          demo2Id,
          'Learn Python & Data Science! Offering in exchange for JavaScript/Web Dev',
          `# Python & Data Science Learning Opportunity

I'm offering to teach **Python programming** and **Data Science** fundamentals in exchange for help with **JavaScript** and **Web Development**.

## What I Can Teach:
- Python basics and advanced concepts
- Data analysis with pandas and numpy
- Data visualization
- Machine learning basics

## What I'm Looking For:
- JavaScript fundamentals
- React and modern web frameworks
- Web development best practices
- Frontend design patterns

## Learning Methods:
- ✅ Video calls for live coding sessions
- ✅ Text chat for quick questions
- ✅ Screen sharing for pair programming
- ✅ Whiteboard for explaining concepts

Let's learn together! 🚀`,
          'open'
        ])
        listingId = listingResult.rows[0].id
        console.log(`✅ Demo listing created (ID: ${listingId})`)
      } else {
        listingId = existingListing.rows[0].id
        console.log(`✅ Demo listing already exists (ID: ${listingId})`)
      }

      // Add skills to listing
      if (tables.includes('listing_skills_offering')) {
        const offeringSkills = ['Python', 'Data Science']
        for (const skillName of offeringSkills) {
          if (skillIds[skillName]) {
            await pool.query(`
              INSERT INTO listing_skills_offering (listing_id, skill_id)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
            `, [listingId, skillIds[skillName]])
          }
        }
      }

      if (tables.includes('listing_skills_seeking')) {
        const seekingSkills = ['JavaScript', 'Web Development']
        for (const skillName of seekingSkills) {
          if (skillIds[skillName]) {
            await pool.query(`
              INSERT INTO listing_skills_seeking (listing_id, skill_id)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
            `, [listingId, skillIds[skillName]])
          }
        }
      }

      // Create an application from Demo User 1 to Demo User 2's listing
      if (tables.includes('applications')) {
        console.log('📝 Creating demo application...')
        const existingApp = await pool.query(`
          SELECT id FROM applications WHERE applicant_id = $1 AND listing_id = $2 LIMIT 1
        `, [demo1Id, listingId])

        if (existingApp.rows.length === 0) {
          await pool.query(`
            INSERT INTO applications (applicant_id, listing_id, message, status)
            VALUES ($1, $2, $3, $4)
          `, [
            demo1Id,
            listingId,
            'Hi! I\'m really interested in learning Python and Data Science. I can help you with JavaScript and Web Development in return. I\'m available for video calls, text chat, or whiteboard sessions. Let\'s connect!',
            'accepted'
          ])
          console.log('✅ Demo application created and accepted')
        } else {
          console.log('✅ Demo application already exists')
        }
      }
    }

    // Create conversations table if it doesn't exist
    if (!tables.includes('conversations')) {
      console.log('📋 Creating conversations table...')
      await pool.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user1_id, user2_id)
        )
      `)
      console.log('✅ Conversations table created')
    }

    // Create messages table if it doesn't exist
    if (!tables.includes('messages')) {
      console.log('📋 Creating messages table...')
      await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
          sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('✅ Messages table created')
    }

    // Create a conversation between the two demo users (outside listings block)
    // Note: We always try since tables might have been just created
    {
      console.log('💬 Creating demo conversation...')
      
      // Check if conversation already exists
      const existingConv = await pool.query(`
        SELECT id FROM conversations 
        WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
        LIMIT 1
      `, [demo1Id, demo2Id])

      let conversationId
      if (existingConv.rows.length === 0) {
        const convResult = await pool.query(`
          INSERT INTO conversations (user1_id, user2_id)
          VALUES ($1, $2)
          RETURNING id
        `, [demo1Id, demo2Id])
        conversationId = convResult.rows[0].id
        console.log(`✅ Demo conversation created (ID: ${conversationId})`)
      } else {
        conversationId = existingConv.rows[0].id
        console.log(`✅ Demo conversation already exists (ID: ${conversationId})`)
      }

      // No sample messages - conversation will be empty
      console.log('✅ Demo conversation ready (no sample messages)')
    }

    console.log('\n✨ Demo testing setup completed successfully!')
    console.log('\n📧 Demo Account 1 (Student):')
    console.log(`   Email: ${DEMO1_EMAIL}`)
    console.log(`   Password: ${DEMO1_PASSWORD}`)
    console.log(`   Skills: Offering JavaScript/Web Dev, Seeking Python/Data Science`)
    console.log('\n📧 Demo Account 2 (Teacher):')
    console.log(`   Email: ${DEMO2_EMAIL}`)
    console.log(`   Password: ${DEMO2_PASSWORD}`)
    console.log(`   Skills: Offering Python/Data Science, Seeking JavaScript/Web Dev`)
    console.log('\n💡 Testing Instructions:')
    console.log('   1. Log in as demo@queldo.app')
    console.log('   2. Go to Marketplace and find the listing from Demo Partner')
    console.log('   3. View the listing - you should see an accepted application')
    console.log('   4. Go to Chat page - you should see a conversation with Demo Partner')
    console.log('   5. Try the text chat, video call, and other features!')
    console.log('   6. Log in as demo2@queldo.app to see the other side\n')

  } catch (error) {
    console.error('❌ Error creating demo testing setup:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run the script
createDemoTestingSetup()


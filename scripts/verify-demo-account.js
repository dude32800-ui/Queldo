const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const DEMO_EMAIL = 'demo@queldo.app'
const DEMO_PASSWORD = 'demo123'

async function verifyDemoAccount() {
  console.log('🔍 Verifying demo account...\n')

  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'queldo',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  })

  try {
    // Check if demo user exists
    const result = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [DEMO_EMAIL]
    )

    if (result.rows.length === 0) {
      console.log('❌ Demo account does not exist!')
      console.log('💡 Run: npm run demo-account\n')
      await pool.end()
      return
    }

    const user = result.rows[0]
    console.log('✅ Demo account found:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Password Hash: ${user.password_hash.substring(0, 20)}...`)

    // Test password
    console.log('\n🔐 Testing password...')
    const isValid = await bcrypt.compare(DEMO_PASSWORD, user.password_hash)
    
    if (isValid) {
      console.log('✅ Password is correct!')
      console.log('\n✨ Demo account is ready to use!')
      console.log(`   Email: ${DEMO_EMAIL}`)
      console.log(`   Password: ${DEMO_PASSWORD}\n`)
    } else {
      console.log('❌ Password verification failed!')
      console.log('💡 The password hash might be incorrect.')
      console.log('💡 Try running: npm run demo-account\n')
    }

  } catch (error) {
    console.error('❌ Error verifying demo account:', error.message)
    console.error(error)
  } finally {
    await pool.end()
  }
}

verifyDemoAccount()


const express = require('express')
const { pool } = require('../database/connection')
const { verifyToken } = require('./auth')

const router = express.Router()

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const userResult = await pool.query(
      'SELECT id, name, email, age, avatar FROM users WHERE id = $1',
      [id]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = userResult.rows[0]

    // Get skills
    const skills = await pool.query(
      `SELECT us.id, s.name, us.skill_type, us.level, us.verified
       FROM user_skills us
       JOIN skills s ON us.skill_id = s.id
       WHERE us.user_id = $1`,
      [id]
    )

    // Get portfolio
    const portfolio = await pool.query(
      'SELECT id, title, url, platform FROM portfolio_links WHERE user_id = $1',
      [id]
    )

    // Get badges
    const badges = await pool.query(
      `SELECT b.name, b.icon, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = $1`,
      [id]
    )

    user.skills = skills.rows
    user.portfolio = portfolio.rows
    user.badges = badges.rows

    res.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user profile
router.patch('/me', verifyToken, async (req, res) => {
  try {
    const { name, avatar } = req.body
    const updates = []
    const values = []
    let paramCount = 1

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`)
      values.push(name)
    }

    if (avatar !== undefined) {
      updates.push(`avatar = $${paramCount++}`)
      values.push(avatar)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(req.userId)

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, age, avatar`,
      values
    )

    res.json({ user: result.rows[0] })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add skill to user
router.post('/me/skills', verifyToken, async (req, res) => {
  try {
    const { skillName, skillType, level } = req.body

    if (!skillName || !skillType || !['offering', 'seeking'].includes(skillType)) {
      return res.status(400).json({ error: 'Invalid skill data' })
    }

    // Get or create skill
    let skillResult = await pool.query('SELECT id FROM skills WHERE name = $1', [skillName])
    let skillId

    if (skillResult.rows.length === 0) {
      const newSkill = await pool.query(
        'INSERT INTO skills (name) VALUES ($1) RETURNING id',
        [skillName]
      )
      skillId = newSkill.rows[0].id
    } else {
      skillId = skillResult.rows[0].id
    }

    // Check if already exists
    const existing = await pool.query(
      'SELECT id FROM user_skills WHERE user_id = $1 AND skill_id = $2 AND skill_type = $3',
      [req.userId, skillId, skillType]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Skill already exists' })
    }

    // Add skill
    const result = await pool.query(
      `INSERT INTO user_skills (user_id, skill_id, skill_type, level)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [req.userId, skillId, skillType, level || 'Beginner']
    )

    res.status(201).json({ message: 'Skill added successfully', id: result.rows[0].id })
  } catch (error) {
    console.error('Add skill error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete skill from user
router.delete('/me/skills/:skillId', verifyToken, async (req, res) => {
  try {
    const { skillId } = req.params

    const result = await pool.query(
      'DELETE FROM user_skills WHERE id = $1 AND user_id = $2 RETURNING id',
      [skillId, req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' })
    }

    res.json({ message: 'Skill removed successfully' })
  } catch (error) {
    console.error('Delete skill error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add portfolio link
router.post('/me/portfolio', verifyToken, async (req, res) => {
  try {
    const { title, url, platform } = req.body

    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required' })
    }

    const result = await pool.query(
      `INSERT INTO portfolio_links (user_id, title, url, platform)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.userId, title, url, platform || null]
    )

    res.status(201).json({ message: 'Portfolio link added', link: result.rows[0] })
  } catch (error) {
    console.error('Add portfolio error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete portfolio link
router.delete('/me/portfolio/:linkId', verifyToken, async (req, res) => {
  try {
    const { linkId } = req.params

    const result = await pool.query(
      'DELETE FROM portfolio_links WHERE id = $1 AND user_id = $2 RETURNING id',
      [linkId, req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio link not found' })
    }

    res.json({ message: 'Portfolio link removed successfully' })
  } catch (error) {
    console.error('Delete portfolio error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete account
router.delete('/me', verifyToken, async (req, res) => {
  try {
    const userId = req.userId

    // Delete user's data in order (to respect foreign key constraints)
    // 1. Delete messages
    await pool.query('DELETE FROM messages WHERE sender_id = $1', [userId])
    
    // 2. Delete conversations
    await pool.query('DELETE FROM conversations WHERE user1_id = $1 OR user2_id = $1', [userId])
    
    // 3. Delete applications
    await pool.query('DELETE FROM applications WHERE applicant_id = $1 OR listing_id IN (SELECT id FROM listings WHERE user_id = $1)', [userId])
    
    // 4. Delete listings and their related data
    await pool.query('DELETE FROM listing_skills_offering WHERE listing_id IN (SELECT id FROM listings WHERE user_id = $1)', [userId])
    await pool.query('DELETE FROM listing_skills_seeking WHERE listing_id IN (SELECT id FROM listings WHERE user_id = $1)', [userId])
    await pool.query('DELETE FROM listings WHERE user_id = $1', [userId])
    
    // 5. Delete user skills
    await pool.query('DELETE FROM user_skills WHERE user_id = $1', [userId])
    
    // 6. Delete portfolio links
    await pool.query('DELETE FROM portfolio_links WHERE user_id = $1', [userId])
    
    // 7. Delete notifications
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId])
    
    // 8. Delete skill trades
    await pool.query('DELETE FROM skill_trades WHERE poster_id = $1 OR applicant_id = $1', [userId])
    
    // 9. Finally, delete the user
    await pool.query('DELETE FROM users WHERE id = $1', [userId])

    res.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({ error: 'Failed to delete account' })
  }
})

module.exports = router


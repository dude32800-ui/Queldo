const express = require('express')
const { pool } = require('../database/connection')
const { verifyToken } = require('./auth')

const router = express.Router()

// Get all listings
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query

    let query = `
      SELECT 
        l.id,
        l.user_id,
        l.title,
        l.description,
        l.status,
        l.created_at,
        u.name as user_name,
        u.avatar as user_avatar,
        ARRAY_AGG(DISTINCT so_skill.name) FILTER (WHERE so_skill.name IS NOT NULL) as skills_offering,
        ARRAY_AGG(DISTINCT ss_skill.name) FILTER (WHERE ss_skill.name IS NOT NULL) as skills_seeking
      FROM listings l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN listing_skills_offering lso ON l.id = lso.listing_id
      LEFT JOIN skills so_skill ON lso.skill_id = so_skill.id
      LEFT JOIN listing_skills_seeking lss ON l.id = lss.listing_id
      LEFT JOIN skills ss_skill ON lss.skill_id = ss_skill.id
      WHERE l.status = 'open'
      GROUP BY l.id, u.name, u.avatar
      ORDER BY l.created_at DESC
    `

    const result = await pool.query(query)
    res.json({ listings: result.rows })
  } catch (error) {
    console.error('Get listings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single listing
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const listingResult = await pool.query(
      `SELECT 
        l.*,
        u.name as user_name,
        u.avatar as user_avatar
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = $1`,
      [id]
    )

    if (listingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' })
    }

    const listing = listingResult.rows[0]

    // Get skills
    const offeringSkills = await pool.query(
      `SELECT s.id, s.name FROM skills s
       JOIN listing_skills_offering lso ON s.id = lso.skill_id
       WHERE lso.listing_id = $1`,
      [id]
    )

    const seekingSkills = await pool.query(
      `SELECT s.id, s.name FROM skills s
       JOIN listing_skills_seeking lss ON s.id = lss.skill_id
       WHERE lss.listing_id = $1`,
      [id]
    )

    listing.skills_offering = offeringSkills.rows
    listing.skills_seeking = seekingSkills.rows

    res.json({ listing })
  } catch (error) {
    console.error('Get listing error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create listing
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, skillsOffering, skillsSeeking } = req.body

    if (!skillsOffering || !skillsSeeking || skillsOffering.length === 0 || skillsSeeking.length === 0) {
      return res.status(400).json({ error: 'Must provide at least one skill offering and seeking' })
    }

    // Create listing
    const listingResult = await pool.query(
      `INSERT INTO listings (user_id, title, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.userId, title || null, description || null]
    )

    const listing = listingResult.rows[0]

    // Add skills offering
    for (const skillName of skillsOffering) {
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

      await pool.query(
        'INSERT INTO listing_skills_offering (listing_id, skill_id) VALUES ($1, $2)',
        [listing.id, skillId]
      )
    }

    // Add skills seeking
    for (const skillName of skillsSeeking) {
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

      await pool.query(
        'INSERT INTO listing_skills_seeking (listing_id, skill_id) VALUES ($1, $2)',
        [listing.id, skillId]
      )
    }

    res.status(201).json({ message: 'Listing created', listing })
  } catch (error) {
    console.error('Create listing error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router


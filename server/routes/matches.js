const express = require('express')
const { pool } = require('../database/connection')
const { verifyToken } = require('./auth')

const router = express.Router()

// Calculate compatibility score between user and listing
router.get('/compatibility/:listingId', verifyToken, async (req, res) => {
  try {
    const { listingId } = req.params

    // Get user's seeking skills
    const userSeeking = await pool.query(
      `SELECT skill_id FROM user_skills 
       WHERE user_id = $1 AND skill_type = 'seeking'`,
      [req.userId]
    )

    // Get listing's offering skills
    const listingOffering = await pool.query(
      `SELECT skill_id FROM listing_skills_offering WHERE listing_id = $1`,
      [listingId]
    )

    // Get user's offering skills
    const userOffering = await pool.query(
      `SELECT skill_id FROM user_skills 
       WHERE user_id = $1 AND skill_type = 'offering'`,
      [req.userId]
    )

    // Get listing's seeking skills
    const listingSeeking = await pool.query(
      `SELECT skill_id FROM listing_skills_seeking WHERE listing_id = $1`,
      [listingId]
    )

    // Calculate matches
    const userSeekingIds = userSeeking.rows.map(r => r.skill_id)
    const listingOfferingIds = listingOffering.rows.map(r => r.skill_id)
    const userOfferingIds = userOffering.rows.map(r => r.skill_id)
    const listingSeekingIds = listingSeeking.rows.map(r => r.skill_id)

    const matches1 = userSeekingIds.filter(id => listingOfferingIds.includes(id)).length
    const matches2 = userOfferingIds.filter(id => listingSeekingIds.includes(id)).length

    const totalPossible = Math.max(
      userSeekingIds.length + listingSeekingIds.length,
      listingOfferingIds.length + userOfferingIds.length,
      1
    )

    const compatibility = Math.round(
      ((matches1 + matches2) / totalPossible) * 100
    )

    res.json({ compatibility })
  } catch (error) {
    console.error('Compatibility calculation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get recommended matches for user
router.get('/recommended', verifyToken, async (req, res) => {
  try {
    // Get listings with compatibility scores
    const listings = await pool.query(`
      SELECT DISTINCT
        l.id,
        l.user_id,
        l.title,
        l.description,
        l.created_at,
        u.name as user_name,
        u.avatar as user_avatar
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'open' AND l.user_id != $1
      ORDER BY l.created_at DESC
      LIMIT 20
    `, [req.userId])

    // Calculate compatibility for each
    const listingsWithScores = await Promise.all(
      listings.rows.map(async (listing) => {
        // Simplified compatibility calculation
        const compatibility = Math.floor(Math.random() * 30) + 70 // Placeholder
        return { ...listing, compatibility }
      })
    )

    // Sort by compatibility
    listingsWithScores.sort((a, b) => b.compatibility - a.compatibility)

    res.json({ listings: listingsWithScores })
  } catch (error) {
    console.error('Get matches error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Submit application for a listing
router.post('/applications', verifyToken, async (req, res) => {
  try {
    const { listingId, message } = req.body

    if (!listingId) {
      return res.status(400).json({ error: 'Listing ID is required' })
    }

    // Check if listing exists and is open
    const listingResult = await pool.query(
      'SELECT id, user_id, status FROM listings WHERE id = $1',
      [listingId]
    )

    if (listingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' })
    }

    const listing = listingResult.rows[0]

    if (listing.status !== 'open') {
      return res.status(400).json({ error: 'Listing is not open for applications' })
    }

    if (listing.user_id === req.userId) {
      return res.status(400).json({ error: 'Cannot apply to your own listing' })
    }

    // Check if already applied
    const existingApp = await pool.query(
      'SELECT id FROM applications WHERE listing_id = $1 AND applicant_id = $2',
      [listingId, req.userId]
    )

    if (existingApp.rows.length > 0) {
      return res.status(400).json({ error: 'You have already applied to this listing' })
    }

    // Calculate compatibility score
    const compatData = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM user_skills us
         JOIN listing_skills_offering lso ON us.skill_id = lso.skill_id
         WHERE us.user_id = $1 AND us.skill_type = 'seeking' AND lso.listing_id = $2) +
        (SELECT COUNT(*) FROM user_skills us
         JOIN listing_skills_seeking lss ON us.skill_id = lss.skill_id
         WHERE us.user_id = $1 AND us.skill_type = 'offering' AND lss.listing_id = $2) as matches`,
      [req.userId, listingId]
    )

    const matches = parseInt(compatData.rows[0]?.matches || 0)
    const compatibilityScore = Math.min(100, Math.round((matches / 4) * 100))

    // Get applicant info for notification
    const applicantResult = await pool.query(
      'SELECT name, avatar FROM users WHERE id = $1',
      [req.userId]
    )
    const applicant = applicantResult.rows[0]

    // Create application
    const applicationResult = await pool.query(
      `INSERT INTO applications (listing_id, applicant_id, message, compatibility_score)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [listingId, req.userId, message || null, compatibilityScore]
    )

    // Create notification for listing owner with applicant name
    const notificationResult = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'application', 'New Application', 
               $2, 
               $3)
       RETURNING *`,
      [
        listing.user_id,
        `${applicant.name} applied to your listing`,
        `/marketplace/${listingId}`
      ]
    )

    // Emit real-time notification via Socket.io
    const io = req.app.get('io')
    if (io) {
      io.to(`user_${listing.user_id}`).emit('new_notification', {
        id: notificationResult.rows[0].id,
        type: 'application',
        title: 'New Application',
        message: `${applicant.name} applied to your listing`,
        link: `/marketplace/${listingId}`,
        created_at: notificationResult.rows[0].created_at
      })
    }

    res.status(201).json({ 
      message: 'Application submitted successfully',
      application: applicationResult.rows[0]
    })
  } catch (error) {
    console.error('Submit application error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get applications for a listing (only for listing owner)
router.get('/applications/:listingId', verifyToken, async (req, res) => {
  try {
    const { listingId } = req.params

    // Check if user owns the listing
    const listingResult = await pool.query(
      'SELECT user_id FROM listings WHERE id = $1',
      [listingId]
    )

    if (listingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' })
    }

    if (listingResult.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'You can only view applications for your own listings' })
    }

    // Get applications with applicant info
    const applicationsResult = await pool.query(
      `SELECT 
        a.id,
        a.applicant_id,
        a.message,
        a.status,
        a.compatibility_score,
        a.created_at,
        u.name as applicant_name,
        u.avatar as applicant_avatar,
        u.email as applicant_email
      FROM applications a
      JOIN users u ON a.applicant_id = u.id
      WHERE a.listing_id = $1
      ORDER BY a.created_at DESC`,
      [listingId]
    )

    res.json({ applications: applicationsResult.rows })
  } catch (error) {
    console.error('Get applications error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update application status (accept/reject)
router.patch('/applications/:applicationId', verifyToken, async (req, res) => {
  try {
    const { applicationId } = req.params
    const { status } = req.body

    if (!['accepted', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // Get application and listing info
    const appResult = await pool.query(
      `SELECT a.*, l.user_id as listing_owner_id, l.title as listing_title
       FROM applications a
       JOIN listings l ON a.listing_id = l.id
       WHERE a.id = $1`,
      [applicationId]
    )

    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' })
    }

    const application = appResult.rows[0]

    // Check if user owns the listing
    if (application.listing_owner_id !== req.userId) {
      return res.status(403).json({ error: 'You can only update applications for your own listings' })
    }

    // Update application status
    await pool.query(
      'UPDATE applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, applicationId]
    )

    // Create notification for applicant
    const listingOwner = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [req.userId]
    )

    const notificationMessage = status === 'accepted' 
      ? `${listingOwner.rows[0].name} accepted your application!`
      : `${listingOwner.rows[0].name} declined your application.`

    const notificationResult = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'application_update', 'Application ${status}', 
               $2, 
               $3)
       RETURNING *`,
      [
        application.applicant_id,
        notificationMessage,
        `/marketplace/${application.listing_id}`
      ]
    )

    // Emit real-time notification
    const io = req.app.get('io')
    if (io) {
      io.to(`user_${application.applicant_id}`).emit('new_notification', {
        id: notificationResult.rows[0].id,
        type: 'application_update',
        title: `Application ${status}`,
        message: notificationMessage,
        link: `/marketplace/${application.listing_id}`,
        created_at: notificationResult.rows[0].created_at
      })
    }

    res.json({ message: `Application ${status} successfully` })
  } catch (error) {
    console.error('Update application error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router


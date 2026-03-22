const express = require('express')
const User = require('../models/User')
const authMiddleware = require('../middleware/authMiddleware')
const upload = require('../middleware/upload')

const router = express.Router()

// GET /api/user/:id — fetch public profile
router.get('/:id', async (req, res) => {
    const userId = req.params.id
    if (!userId) return res.status(404).json({ message: 'User Not Found' })

    try {
        const getUser = await User.findById(userId).select('-password')
        if (!getUser) return res.status(404).json({ message: 'User Not Found' })
        return res.status(200).json({ message: 'User Profile Fetched', getUser })
    } catch (error) {
        return res.status(500).json({ message: 'Server Error' })
    }
})

// PATCH /api/user/:id — update profile (supports optional image upload via multipart/form-data)
router.patch('/:id', authMiddleware, upload.single('profile_pic'), async (req, res) => {
    const userId = req.params.id
    if (!userId) return res.status(404).json({ message: 'User Not Found' })

    try {
        const getUser = await User.findById(userId).select('-password')
        if (!getUser) return res.status(404).json({ message: 'User Not Found' })

        if (userId !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden access' })
        }

        const { name, username, bio, country, gender } = req.body

        // Build the update object — only include what was provided
        const updates = {}
        if (name !== undefined) updates.name = name
        if (username !== undefined) updates.username = username
        if (bio !== undefined) updates.bio = bio
        if (country !== undefined) updates.country = country
        if (gender !== undefined) updates.gender = gender

        // If a new file was uploaded, use it; otherwise, keep existing
        if (req.file) {
            updates.profile_pic = `/uploads/${req.file.filename}`
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true }
        ).select('-password')

        return res.status(200).json({ message: 'Profile updated', updatedUser })
    } catch (error) {
        // Handle multer errors (e.g. wrong file type, too large)
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'Image must be under 5 MB.' })
        }
        return res.status(500).json({ message: 'Server Error', error: error.message })
    }
})

module.exports = router
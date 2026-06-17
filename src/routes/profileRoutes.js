const express = require('express');
const router = express.Router();
const {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
  deleteProfile,
} = require('../controllers/profileController');

// Analyze a GitHub user and store / update the profile
router.post('/analyze/:username', analyzeProfile);

// List all stored profiles (paginated)
router.get('/profiles', getAllProfiles);

// Get a single stored profile by username
router.get('/profiles/:username', getProfileByUsername);

// Delete a stored profile by username
router.delete('/profiles/:username', deleteProfile);

module.exports = router;

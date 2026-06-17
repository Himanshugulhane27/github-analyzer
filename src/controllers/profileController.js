const pool = require('../config/db');
const { analyzeUser } = require('../services/githubService');

/**
 * POST /api/analyze/:username
 *
 * Fetches profile data from GitHub, computes insights, and upserts the
 * record in the database.  Returns 201 for new profiles and 200 for updates.
 */
async function analyzeProfile(req, res, next) {
  try {
    const { username } = req.params;

    // 1. Fetch & analyze from GitHub
    let profileData;
    try {
      profileData = await analyzeUser(username);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({ error: 'GitHub user not found' });
      }
      throw err; // re-throw unexpected errors
    }

    // 2. Check if the profile already exists in the DB
    const [existing] = await pool.execute(
      'SELECT id FROM profiles WHERE username = ?',
      [profileData.username]
    );

    if (existing.length > 0) {
      // ---- UPDATE existing record ----
      await pool.execute(
        `UPDATE profiles
            SET name               = ?,
                bio                = ?,
                avatar_url         = ?,
                location           = ?,
                email              = ?,
                company            = ?,
                blog               = ?,
                public_repos       = ?,
                public_gists       = ?,
                followers          = ?,
                following          = ?,
                top_languages      = ?,
                most_starred_repo  = ?,
                most_starred_repo_stars = ?,
                total_stars        = ?,
                account_created_at = ?,
                github_updated_at  = ?,
                last_reanalyzed_at = NOW()
          WHERE username = ?`,
        [
          profileData.name,
          profileData.bio,
          profileData.avatar_url,
          profileData.location,
          profileData.email,
          profileData.company,
          profileData.blog,
          profileData.public_repos,
          profileData.public_gists,
          profileData.followers,
          profileData.following,
          JSON.stringify(profileData.top_languages),
          profileData.most_starred_repo,
          profileData.most_starred_repo_stars,
          profileData.total_stars,
          profileData.account_created_at,
          profileData.github_updated_at,
          profileData.username,
        ]
      );

      const [rows] = await pool.execute(
        'SELECT * FROM profiles WHERE username = ?',
        [profileData.username]
      );

      return res.status(200).json({
        message: 'Profile updated (re-analyzed)',
        profile: rows[0],
      });
    }

    // ---- INSERT new record ----
    await pool.execute(
      `INSERT INTO profiles
          (username, name, bio, avatar_url, location, email, company, blog,
           public_repos, public_gists, followers, following,
           top_languages, most_starred_repo, most_starred_repo_stars,
           total_stars, account_created_at, github_updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profileData.username,
        profileData.name,
        profileData.bio,
        profileData.avatar_url,
        profileData.location,
        profileData.email,
        profileData.company,
        profileData.blog,
        profileData.public_repos,
        profileData.public_gists,
        profileData.followers,
        profileData.following,
        JSON.stringify(profileData.top_languages),
        profileData.most_starred_repo,
        profileData.most_starred_repo_stars,
        profileData.total_stars,
        profileData.account_created_at,
        profileData.github_updated_at,
      ]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM profiles WHERE username = ?',
      [profileData.username]
    );

    return res.status(201).json({
      message: 'Profile created',
      profile: rows[0],
    });
  } catch (err) {
    console.error('[analyzeProfile] Error:', err.message);
    next(err);
  }
}

/**
 * GET /api/profiles
 *
 * Returns all stored profiles with pagination support.
 * Query params: ?page=1&limit=10
 */
async function getAllProfiles(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const offset = (page - 1) * limit;

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) AS total FROM profiles'
    );
    const total = countResult[0].total;

    const [rows] = await pool.execute(
      'SELECT * FROM profiles ORDER BY analyzed_at DESC LIMIT ? OFFSET ?',
      [String(limit), String(offset)]
    );

    return res.status(200).json({
      total,
      page,
      limit,
      data: rows,
    });
  } catch (err) {
    console.error('[getAllProfiles] Error:', err.message);
    next(err);
  }
}

/**
 * GET /api/profiles/:username
 *
 * Returns a single profile by username.
 */
async function getProfileByUsername(req, res, next) {
  try {
    const { username } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM profiles WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error:
          'Profile not found. Use POST /api/analyze/:username first.',
      });
    }

    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error('[getProfileByUsername] Error:', err.message);
    next(err);
  }
}

/**
 * DELETE /api/profiles/:username
 *
 * Deletes a profile from the database.
 */
async function deleteProfile(req, res, next) {
  try {
    const { username } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM profiles WHERE username = ?',
      [username]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res
      .status(200)
      .json({ message: 'Profile deleted successfully' });
  } catch (err) {
    console.error('[deleteProfile] Error:', err.message);
    next(err);
  }
}

module.exports = {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
  deleteProfile,
};

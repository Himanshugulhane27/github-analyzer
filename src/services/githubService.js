const axios = require('axios');

/**
 * Build common Axios request headers.
 * If a GITHUB_TOKEN is configured, include it as a Bearer token
 * to benefit from higher GitHub API rate limits.
 */
function buildHeaders() {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-Profile-Analyzer',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

/**
 * Fetch the public profile of a GitHub user.
 *
 * @param {string} username - GitHub username
 * @returns {object} GitHub user profile data
 * @throws Will throw with response status 404 when the user does not exist
 */
async function fetchUserProfile(username) {
  const { data } = await axios.get(
    `https://api.github.com/users/${encodeURIComponent(username)}`,
    { headers: buildHeaders() }
  );
  return data;
}

/**
 * Fetch public repositories for a GitHub user sorted by stars (descending).
 *
 * @param {string} username - GitHub username
 * @returns {Array} Array of repository objects
 */
async function fetchUserRepos(username) {
  const { data } = await axios.get(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos`,
    {
      headers: buildHeaders(),
      params: {
        per_page: 100,
        sort: 'stars',
        direction: 'desc',
      },
    }
  );
  return data;
}

/**
 * Derive insights from a list of repositories.
 *
 * Returns:
 *  - topLanguages: top 5 languages by number of repos using them
 *  - mostStarredRepo: name of the repo with the highest star count
 *  - mostStarredRepoStars: star count of that repo
 *  - totalStars: sum of stargazers_count across all repos
 *
 * @param {Array} repos - Array of GitHub repo objects
 * @returns {object} Computed insights
 */
function deriveRepoInsights(repos) {
  const languageCounts = {};
  let totalStars = 0;
  let mostStarredRepo = null;
  let mostStarredRepoStars = 0;

  for (const repo of repos) {
    // Accumulate stars
    totalStars += repo.stargazers_count || 0;

    // Track the most-starred repo
    if ((repo.stargazers_count || 0) > mostStarredRepoStars) {
      mostStarredRepoStars = repo.stargazers_count;
      mostStarredRepo = repo.name;
    }

    // Count languages
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  }

  // Sort languages by count descending, take top 5
  const topLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([language, count]) => ({ language, count }));

  return {
    topLanguages,
    mostStarredRepo,
    mostStarredRepoStars,
    totalStars,
  };
}

/**
 * Analyse a GitHub user: fetch profile + repos, compute insights,
 * and return a single structured object ready for database storage.
 *
 * @param {string} username - GitHub username
 * @returns {object} Combined profile + insights object
 */
async function analyzeUser(username) {
  const [profile, repos] = await Promise.all([
    fetchUserProfile(username),
    fetchUserRepos(username),
  ]);

  const insights = deriveRepoInsights(repos);

  return {
    username: profile.login,
    name: profile.name || null,
    bio: profile.bio || null,
    avatar_url: profile.avatar_url || null,
    location: profile.location || null,
    email: profile.email || null,
    company: profile.company || null,
    blog: profile.blog || null,
    public_repos: profile.public_repos || 0,
    public_gists: profile.public_gists || 0,
    followers: profile.followers || 0,
    following: profile.following || 0,
    top_languages: insights.topLanguages,
    most_starred_repo: insights.mostStarredRepo,
    most_starred_repo_stars: insights.mostStarredRepoStars,
    total_stars: insights.totalStars,
    account_created_at: profile.created_at
      ? new Date(profile.created_at)
      : null,
    github_updated_at: profile.updated_at
      ? new Date(profile.updated_at)
      : null,
  };
}

module.exports = { analyzeUser };

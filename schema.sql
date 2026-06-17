-- GitHub Profile Analyzer - Database Schema
-- Run this file to set up the database:
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS github_analyzer;
USE github_analyzer;

CREATE TABLE IF NOT EXISTS profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200),
  bio TEXT,
  avatar_url VARCHAR(500),
  location VARCHAR(200),
  email VARCHAR(200),
  company VARCHAR(200),
  blog VARCHAR(300),
  public_repos INT DEFAULT 0,
  public_gists INT DEFAULT 0,
  followers INT DEFAULT 0,
  following INT DEFAULT 0,
  top_languages JSON,
  most_starred_repo VARCHAR(200),
  most_starred_repo_stars INT DEFAULT 0,
  total_stars INT DEFAULT 0,
  account_created_at DATETIME,
  github_updated_at DATETIME,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_reanalyzed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

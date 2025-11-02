-- Run this SQL directly in Neon Console
-- Go to: https://console.neon.tech → Your Project → SQL Editor
-- Paste and run this:

CREATE TABLE IF NOT EXISTS ai_tools (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  short_description VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  pricing VARCHAR(50) NOT NULL,
  website_url VARCHAR(500) NOT NULL,
  logo_url VARCHAR(500),
  features TEXT NOT NULL DEFAULT '[]',
  tags TEXT NOT NULL DEFAULT '[]',
  badge VARCHAR(50),
  rating INTEGER,
  source_detail_url VARCHAR(500),
  developer VARCHAR(255),
  documentation_url VARCHAR(500),
  social_links TEXT DEFAULT '{}',
  use_cases TEXT DEFAULT '[]',
  launch_date VARCHAR(50),
  last_updated VARCHAR(50),
  screenshots TEXT DEFAULT '[]',
  pricing_details TEXT DEFAULT '{}'
);


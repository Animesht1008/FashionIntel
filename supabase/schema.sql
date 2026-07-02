-- ============================================================
-- Fashion News Agent — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Users (for login/signup)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Topics to monitor
CREATE TABLE IF NOT EXISTS topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- News sources
CREATE TABLE IF NOT EXISTS sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Brands / competitors to track
CREATE TABLE IF NOT EXISTS competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Processed articles
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE NOT NULL,
  image_url TEXT,
  source_name TEXT,
  published_at TIMESTAMPTZ,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  competitor_id UUID REFERENCES competitors(id) ON DELETE SET NULL,
  ai_summary TEXT,
  relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 10),
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  news_type TEXT CHECK (news_type IN ('product_launch','campaign','discount','earnings','acquisition','trend','controversy','partnership','other')), -- NOTE: ai.js coerces any AI-invented type (e.g. "regulation") to 'other' before insert
  key_insights TEXT[],
  is_noise BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent run logs
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  triggered_by TEXT DEFAULT 'scheduler',
  status TEXT CHECK (status IN ('running', 'completed', 'failed')),
  articles_fetched INTEGER DEFAULT 0,
  articles_saved INTEGER DEFAULT 0,
  articles_filtered INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Activity / app logs (Winston → DB)
CREATE TABLE IF NOT EXISTS logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Seed Data
-- ============================================================

INSERT INTO topics (name, keywords) VALUES
  ('Luxury Fashion', ARRAY['Louis Vuitton','Gucci','Prada','Chanel','Hermès','luxury fashion','LVMH']),
  ('Fast Fashion', ARRAY['Zara','H&M','Shein','Uniqlo','fast fashion','Primark','Boohoo']),
  ('Sportswear & Athleisure', ARRAY['Nike','Adidas','Lululemon','Puma','sportswear','athleisure','Under Armour']),
  ('Indian Fashion Brands', ARRAY['Fabindia','Manyavar','Nykaa Fashion','Myntra','Indian fashion','Meena Bazaar']),
  ('Consumer Spending Trends', ARRAY['fashion spending','retail sales','consumer trends','apparel market','fashion retail']),
  ('Fashion Sales & Discounts', ARRAY['fashion sale','end of season sale','Black Friday fashion','discount fashion','fashion week sale'])
ON CONFLICT DO NOTHING;

INSERT INTO sources (name, domain) VALUES
  ('Business of Fashion', 'businessoffashion.com'),
  ('Vogue Business', 'voguebusiness.com'),
  ('Reuters', 'reuters.com'),
  ('Forbes', 'forbes.com'),
  ('Economic Times', 'economictimes.indiatimes.com'),
  ('WWD', 'wwd.com'),
  ('Fashionista', 'fashionista.com')
ON CONFLICT DO NOTHING;

INSERT INTO competitors (name, keywords, category) VALUES
  ('Nike', ARRAY['Nike','Nike sales','Nike launch','Nike campaign','Nike revenue'], 'Sportswear'),
  ('Adidas', ARRAY['Adidas','Adidas collaboration','Adidas revenue','Adidas collection'], 'Sportswear'),
  ('Zara', ARRAY['Zara','Zara collection','Inditex','Zara launch'], 'Fast Fashion'),
  ('H&M', ARRAY['H&M','H&M sales','H&M sustainability','H&M collection'], 'Fast Fashion'),
  ('Louis Vuitton', ARRAY['Louis Vuitton','LV','LVMH fashion','Louis Vuitton launch'], 'Luxury'),
  ('Gucci', ARRAY['Gucci','Gucci campaign','Gucci revenue','Gucci collection'], 'Luxury'),
  ('Shein', ARRAY['Shein','Shein controversy','Shein expansion','Shein IPO'], 'Fast Fashion'),
  ('Lululemon', ARRAY['Lululemon','Lululemon earnings','Lululemon collaboration','Lululemon new'], 'Athleisure')
ON CONFLICT DO NOTHING;

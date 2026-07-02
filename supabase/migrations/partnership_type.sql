-- Run this in Supabase SQL Editor if your database was created
-- BEFORE the news_type list included 'partnership'.
-- Safe to run multiple times.

ALTER TABLE articles
DROP CONSTRAINT IF EXISTS articles_news_type_check;

ALTER TABLE articles
ADD CONSTRAINT articles_news_type_check
CHECK (news_type IN (
  'product_launch','campaign','discount','earnings',
  'acquisition','trend','controversy','partnership','other'
));

-- Also ensure service_role has full access (some Supabase projects
-- require explicit grants even though service_role bypasses RLS)
GRANT ALL ON TABLE users        TO service_role;
GRANT ALL ON TABLE topics       TO service_role;
GRANT ALL ON TABLE sources      TO service_role;
GRANT ALL ON TABLE competitors  TO service_role;
GRANT ALL ON TABLE articles     TO service_role;
GRANT ALL ON TABLE agent_runs   TO service_role;
GRANT ALL ON TABLE logs         TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

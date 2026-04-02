-- ============================================================
-- 015: Reddit-Style Discussion Upgrades
-- ============================================================

-- 1. Add vote value to upvote tables (+1 upvote, -1 downvote)
ALTER TABLE topic_upvotes
  ADD COLUMN IF NOT EXISTS value smallint NOT NULL DEFAULT 1
    CHECK (value IN (-1, 1));

ALTER TABLE comment_upvotes
  ADD COLUMN IF NOT EXISTS value smallint NOT NULL DEFAULT 1
    CHECK (value IN (-1, 1));

-- 2. Add edited_at and is_deleted to comments for soft delete + edit tracking
ALTER TABLE topic_comments
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- 3. Add edited_at to topics
ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- 4. Add downvotes column to topics and comments for fast reads
ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS downvotes int NOT NULL DEFAULT 0;

ALTER TABLE topic_comments
  ADD COLUMN IF NOT EXISTS downvotes int NOT NULL DEFAULT 0;

-- 5. Update unique constraint on upvote tables to allow vote changes
-- Drop existing unique constraint if any, then recreate
DO $$ BEGIN
  -- topic_upvotes: ensure one vote per user per topic
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'topic_upvotes_user_topic_unique'
  ) THEN
    BEGIN
      ALTER TABLE topic_upvotes ADD CONSTRAINT topic_upvotes_user_topic_unique UNIQUE (user_id, topic_id);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;

  -- comment_upvotes: ensure one vote per user per comment
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comment_upvotes_user_comment_unique'
  ) THEN
    BEGIN
      ALTER TABLE comment_upvotes ADD CONSTRAINT comment_upvotes_user_comment_unique UNIQUE (user_id, comment_id);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;

-- 6. Function to vote on a topic (upsert + update counters)
CREATE OR REPLACE FUNCTION vote_topic(
  p_user_id uuid,
  p_topic_id uuid,
  p_value smallint  -- +1, -1, or 0 (remove vote)
) RETURNS void AS $$
DECLARE
  old_value smallint;
BEGIN
  -- Get existing vote
  SELECT value INTO old_value FROM topic_upvotes
    WHERE user_id = p_user_id AND topic_id = p_topic_id;

  IF p_value = 0 THEN
    -- Remove vote
    IF old_value IS NOT NULL THEN
      DELETE FROM topic_upvotes WHERE user_id = p_user_id AND topic_id = p_topic_id;
      IF old_value = 1 THEN
        UPDATE topics SET upvotes = upvotes - 1 WHERE id = p_topic_id;
      ELSE
        UPDATE topics SET downvotes = downvotes - 1 WHERE id = p_topic_id;
      END IF;
    END IF;
  ELSIF old_value IS NULL THEN
    -- New vote
    INSERT INTO topic_upvotes (user_id, topic_id, value) VALUES (p_user_id, p_topic_id, p_value);
    IF p_value = 1 THEN
      UPDATE topics SET upvotes = upvotes + 1 WHERE id = p_topic_id;
    ELSE
      UPDATE topics SET downvotes = downvotes + 1 WHERE id = p_topic_id;
    END IF;
  ELSIF old_value != p_value THEN
    -- Change vote
    UPDATE topic_upvotes SET value = p_value WHERE user_id = p_user_id AND topic_id = p_topic_id;
    IF p_value = 1 THEN
      UPDATE topics SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = p_topic_id;
    ELSE
      UPDATE topics SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = p_topic_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to vote on a comment
CREATE OR REPLACE FUNCTION vote_comment(
  p_user_id uuid,
  p_comment_id uuid,
  p_value smallint
) RETURNS void AS $$
DECLARE
  old_value smallint;
BEGIN
  SELECT value INTO old_value FROM comment_upvotes
    WHERE user_id = p_user_id AND comment_id = p_comment_id;

  IF p_value = 0 THEN
    IF old_value IS NOT NULL THEN
      DELETE FROM comment_upvotes WHERE user_id = p_user_id AND comment_id = p_comment_id;
      IF old_value = 1 THEN
        UPDATE topic_comments SET upvotes = upvotes - 1 WHERE id = p_comment_id;
      ELSE
        UPDATE topic_comments SET downvotes = downvotes - 1 WHERE id = p_comment_id;
      END IF;
    END IF;
  ELSIF old_value IS NULL THEN
    INSERT INTO comment_upvotes (user_id, comment_id, value) VALUES (p_user_id, p_comment_id, p_value);
    IF p_value = 1 THEN
      UPDATE topic_comments SET upvotes = upvotes + 1 WHERE id = p_comment_id;
    ELSE
      UPDATE topic_comments SET downvotes = downvotes + 1 WHERE id = p_comment_id;
    END IF;
  ELSIF old_value != p_value THEN
    UPDATE comment_upvotes SET value = p_value WHERE user_id = p_user_id AND comment_id = p_comment_id;
    IF p_value = 1 THEN
      UPDATE topic_comments SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = p_comment_id;
    ELSE
      UPDATE topic_comments SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = p_comment_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

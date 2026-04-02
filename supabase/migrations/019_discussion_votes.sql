-- ============================================================
-- 019: Add upvotes/downvotes to discussions table
-- ============================================================

ALTER TABLE discussions
  ADD COLUMN IF NOT EXISTS upvotes int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downvotes int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Discussion votes table
CREATE TABLE IF NOT EXISTS discussion_votes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discussion_id text NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  value smallint NOT NULL CHECK (value IN (-1, 1)),
  PRIMARY KEY (user_id, discussion_id)
);

ALTER TABLE discussion_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view discussion votes" ON discussion_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert discussion votes" ON discussion_votes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update discussion votes" ON discussion_votes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete discussion votes" ON discussion_votes FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_discussion_votes_discussion ON discussion_votes(discussion_id);

-- Vote function
CREATE OR REPLACE FUNCTION vote_discussion(
  p_user_id uuid,
  p_discussion_id text,
  p_value smallint
) RETURNS void AS $$
DECLARE
  old_value smallint;
BEGIN
  SELECT value INTO old_value FROM discussion_votes
    WHERE user_id = p_user_id AND discussion_id = p_discussion_id;

  IF p_value = 0 THEN
    IF old_value IS NOT NULL THEN
      DELETE FROM discussion_votes WHERE user_id = p_user_id AND discussion_id = p_discussion_id;
      IF old_value = 1 THEN
        UPDATE discussions SET upvotes = upvotes - 1 WHERE id = p_discussion_id;
      ELSE
        UPDATE discussions SET downvotes = downvotes - 1 WHERE id = p_discussion_id;
      END IF;
    END IF;
  ELSIF old_value IS NULL THEN
    INSERT INTO discussion_votes (user_id, discussion_id, value) VALUES (p_user_id, p_discussion_id, p_value);
    IF p_value = 1 THEN
      UPDATE discussions SET upvotes = upvotes + 1 WHERE id = p_discussion_id;
    ELSE
      UPDATE discussions SET downvotes = downvotes + 1 WHERE id = p_discussion_id;
    END IF;
  ELSIF old_value != p_value THEN
    UPDATE discussion_votes SET value = p_value WHERE user_id = p_user_id AND discussion_id = p_discussion_id;
    IF p_value = 1 THEN
      UPDATE discussions SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = p_discussion_id;
    ELSE
      UPDATE discussions SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = p_discussion_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

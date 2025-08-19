-- Create 'user_sessions' view for backward compatibility with JWT refresh token code
-- Maps to Better Auth 'session' table

CREATE OR REPLACE VIEW user_sessions AS
SELECT 
  id,
  "userId",
  token,
  "expiresAt"
FROM "session";

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO revivatech;

-- Create trigger to handle INSERT/UPDATE/DELETE operations on the view
CREATE OR REPLACE FUNCTION user_sessions_view_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "session" (
      id, "userId", token, "expiresAt"
    ) VALUES (
      COALESCE(NEW.id, gen_random_uuid()::text),
      NEW."userId",
      NEW.token,
      NEW."expiresAt"
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE "session" SET
      "userId" = NEW."userId",
      token = NEW.token,
      "expiresAt" = NEW."expiresAt"
    WHERE id = NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM "session" WHERE id = OLD.id OR token = OLD.token;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS user_sessions_view_trigger ON user_sessions;

-- Create trigger for INSERT/UPDATE/DELETE operations
CREATE TRIGGER user_sessions_view_trigger
INSTEAD OF INSERT OR UPDATE OR DELETE ON user_sessions
FOR EACH ROW
EXECUTE FUNCTION user_sessions_view_trigger_fn();

COMMENT ON VIEW user_sessions IS 'Backward compatibility view for JWT refresh token code. Maps to Better Auth session table.';
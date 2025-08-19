-- Create 'users' view for backward compatibility with JWT code
-- Maps to Better Auth 'user' table

CREATE OR REPLACE VIEW users AS
SELECT 
  id,
  email,
  "firstName",
  "lastName",
  "firstName" as first_name,  -- Alias for old column naming
  "lastName" as last_name,    -- Alias for old column naming
  name,
  phone,
  role,
  "isActive",
  "isActive" as is_active,    -- Alias for old column naming
  "emailVerified" as "isVerified",
  "emailVerified" as is_verified, -- Alias for old column naming
  image,
  "createdAt" as created_at,
  "updatedAt" as updated_at,
  "createdAt",
  "updatedAt"
FROM "user";

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO revivatech;

-- Create trigger to handle INSERT/UPDATE/DELETE operations on the view
CREATE OR REPLACE FUNCTION users_view_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "user" (
      id, email, "firstName", "lastName", name, phone, role, "isActive", "emailVerified"
    ) VALUES (
      COALESCE(NEW.id, gen_random_uuid()::text),
      NEW.email,
      COALESCE(NEW."firstName", NEW.first_name),
      COALESCE(NEW."lastName", NEW.last_name),
      COALESCE(NEW.name, CONCAT(COALESCE(NEW."firstName", NEW.first_name, ''), ' ', COALESCE(NEW."lastName", NEW.last_name, ''))),
      NEW.phone,
      COALESCE(NEW.role, 'CUSTOMER'),
      COALESCE(NEW."isActive", NEW.is_active, true),
      COALESCE(NEW."isVerified", NEW.is_verified, false)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE "user" SET
      email = NEW.email,
      "firstName" = COALESCE(NEW."firstName", NEW.first_name),
      "lastName" = COALESCE(NEW."lastName", NEW.last_name),
      name = COALESCE(NEW.name, CONCAT(COALESCE(NEW."firstName", NEW.first_name, ''), ' ', COALESCE(NEW."lastName", NEW.last_name, ''))),
      phone = NEW.phone,
      role = NEW.role,
      "isActive" = COALESCE(NEW."isActive", NEW.is_active),
      "emailVerified" = COALESCE(NEW."isVerified", NEW.is_verified)
    WHERE id = NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM "user" WHERE id = OLD.id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS users_view_trigger ON users;

-- Create trigger for INSERT/UPDATE/DELETE operations
CREATE TRIGGER users_view_trigger
INSTEAD OF INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION users_view_trigger_fn();

-- Create index on the view for performance
-- Note: Indexes are inherited from the underlying table

COMMENT ON VIEW users IS 'Backward compatibility view for JWT authentication code. Maps to Better Auth user table.';
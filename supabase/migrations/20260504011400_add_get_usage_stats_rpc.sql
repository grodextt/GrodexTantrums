CREATE OR REPLACE FUNCTION get_usage_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  db_size_bytes bigint;
  storage_size_bytes bigint;
BEGIN
  -- Get Database Size
  SELECT pg_database_size(current_database()) INTO db_size_bytes;
  
  -- Get Storage Size
  SELECT COALESCE(SUM((metadata->>'size')::bigint), 0) INTO storage_size_bytes
  FROM storage.objects;

  RETURN json_build_object(
    'db_size', json_build_object('usage', db_size_bytes, 'limit', 500::bigint * 1024 * 1024),
    'storage_size', json_build_object('usage', storage_size_bytes, 'limit', 1024::bigint * 1024 * 1024),
    'egress', json_build_object('usage', 0, 'limit', 5::bigint * 1024 * 1024 * 1024),
    'monthly_active_users', json_build_object('usage', 0, 'limit', 50000)
  );
END;
$$;

-- Revoke execute from public to make it admin only
REVOKE EXECUTE ON FUNCTION get_usage_stats() FROM public;
GRANT EXECUTE ON FUNCTION get_usage_stats() TO service_role;

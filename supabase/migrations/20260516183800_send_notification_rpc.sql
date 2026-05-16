CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_type notification_type,
  p_manga_id UUID,
  p_comment_id UUID,
  p_title TEXT,
  p_message TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, type, manga_id, comment_id, title, message)
  VALUES (p_user_id, p_type, p_manga_id, p_comment_id, p_title, p_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bật Realtime cho các bảng admin cần theo dõi (chạy an toàn nhiều lần).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers','pets','bookings','booking_items'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

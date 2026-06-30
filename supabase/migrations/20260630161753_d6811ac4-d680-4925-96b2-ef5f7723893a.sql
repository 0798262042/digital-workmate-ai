
-- Restrict trigger function (not for direct app use)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Storage policies
CREATE POLICY "user docs select own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "user docs insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "user docs update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "user docs delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- profilesバケットのRLSポリシーを設定

-- 既存のポリシーがあれば削除（エラー回避）
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- 1. INSERT ポリシー（認証済みユーザーがアップロード可能）
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profiles');

-- 2. SELECT ポリシー（誰でも読み取り可能）
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'profiles');

-- 3. UPDATE ポリシー（認証済みユーザーが更新可能）
CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profiles');

-- 4. DELETE ポリシー（認証済みユーザーが削除可能）
CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profiles');

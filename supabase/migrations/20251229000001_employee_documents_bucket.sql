-- employee-documents バケットの作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-documents',
  'employee-documents',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLSポリシー: 認証済みユーザーは読み取り可能
CREATE POLICY "Authenticated users can view employee documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'employee-documents');

-- RLSポリシー: Service roleのみアップロード可能
CREATE POLICY "Service role can upload employee documents"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'employee-documents');

-- RLSポリシー: Service roleのみ更新可能
CREATE POLICY "Service role can update employee documents"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'employee-documents');

-- RLSポリシー: Service roleのみ削除可能
CREATE POLICY "Service role can delete employee documents"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'employee-documents');

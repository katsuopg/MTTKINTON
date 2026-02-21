-- プロジェクト資料（ファイル）テーブル
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT, -- pdf, image, dwg, doc, other
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_files_project_id ON project_files(project_id);

-- RLSポリシー
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read project files"
  ON project_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert project files"
  ON project_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete project files"
  ON project_files FOR DELETE
  TO authenticated
  USING (true);

-- ストレージバケット
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- ストレージポリシー
CREATE POLICY "Authenticated users can upload project files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "Authenticated users can read project files storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-files');

CREATE POLICY "Authenticated users can delete project files storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-files');

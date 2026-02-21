-- ============================================
-- プロジェクトコード採番形式変更
-- 旧: PJ-YYYY-NNNNNN (例: PJ-2026-000001)
-- 新: P + 西暦下2桁 + 3桁連番 (例: P26001)
-- 手動入力時はそのまま使用
-- ============================================

-- 旧シーケンスは不要（年ごとにMAXから採番するため）
DROP SEQUENCE IF EXISTS project_seq;

-- 自動採番関数を更新
CREATE OR REPLACE FUNCTION generate_project_code()
RETURNS TRIGGER AS $$
DECLARE
  year_2digit VARCHAR(2);
  max_num INTEGER;
  next_num INTEGER;
BEGIN
  -- 手動入力があればそのまま使用
  IF NEW.project_code IS NOT NULL AND NEW.project_code != '' THEN
    RETURN NEW;
  END IF;

  -- 現在の西暦下2桁
  year_2digit := to_char(NOW(), 'YY');

  -- 今年の最大番号を取得 (P26001 → 1, P26012 → 12)
  SELECT COALESCE(
    MAX(
      CAST(substring(project_code FROM 4) AS INTEGER)
    ), 0)
  INTO max_num
  FROM projects
  WHERE project_code LIKE 'P' || year_2digit || '%'
    AND length(project_code) >= 4
    AND substring(project_code FROM 4) ~ '^\d+$';

  next_num := max_num + 1;

  -- P + 2桁年 + 3桁連番 (例: P26001)
  NEW.project_code := 'P' || year_2digit || lpad(next_num::text, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- コメント更新
COMMENT ON COLUMN projects.project_code IS 'P + 西暦下2桁 + 3桁連番 (例: P26001)。手動入力可。';

-- プロジェクトに担当営業カラム追加
ALTER TABLE projects ADD COLUMN sales_person_id UUID REFERENCES employees(id);
CREATE INDEX idx_projects_sales_person_id ON projects(sales_person_id);

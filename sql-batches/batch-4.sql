INSERT INTO customers (
  kintone_record_id, customer_id, company_name, customer_rank,
  country, phone_number, fax_number, tax_id, payment_terms,
  address, website_url, notes, created_by, updated_by
) VALUES 
  ('110', '66-129-RATO', 'RATO INDUSTRIAL (THAILAND)', 'C', 'Thailand', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('109', '66-128-WPA', 'WPA Engineering', 'C', 'Thailand', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('108', '66-127-SYS', 'S.Y.S. METAL PRODUCTS CO., LTD.', 'B', 'Thailand', '023122153', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('107', '66-126-KLK', 'KLK INDUSTRY CO.,LTD', 'B', 'Thailand', '029140421-4', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('106', '66-125-SPB', 'Sunpark Bangkok Co.,Ltd.', 'B', 'Thailand', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('105', '66-124-TOPRE', 'TOPRE (THAILAND),.LTD.', 'A', 'THAILAND', '021365370', '021365364', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('104', '66-123-TRT', 'T-RAD (THAILAND) CO.,LTD.', 'B', 'THAILAND', '038571450', '038571444', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('103', '65-122-ECS', 'Easy Control System Co., Ltd.', 'C', ' Pathum Thani', ' 082 - 4597262', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('102', '65-121-NTA', 'North Tech Automation Co.,Ltd ', 'C', ' Bangkok', '0-2521-1328   ', '0-2521-1329', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('101', '64-120-ALK', 'A.L.K. Precision Works (1976) Co.,Ltd.', 'C', 'Bangkok ', '02-4441900', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut')
ON CONFLICT (kintone_record_id) DO UPDATE SET
  customer_id = EXCLUDED.customer_id,
  company_name = EXCLUDED.company_name,
  customer_rank = EXCLUDED.customer_rank,
  country = EXCLUDED.country,
  phone_number = EXCLUDED.phone_number,
  fax_number = EXCLUDED.fax_number,
  tax_id = EXCLUDED.tax_id,
  payment_terms = EXCLUDED.payment_terms,
  address = EXCLUDED.address,
  website_url = EXCLUDED.website_url,
  notes = EXCLUDED.notes,
  updated_by = EXCLUDED.updated_by,
  updated_at = NOW();
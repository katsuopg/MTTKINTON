INSERT INTO customers (
  kintone_record_id, customer_id, company_name, customer_rank,
  country, phone_number, fax_number, tax_id, payment_terms,
  address, website_url, notes, created_by, updated_by
) VALUES 
  ('142', '68-158-TAZM', 'THAI TAZM TECH CO.,LTD.', 'C', 'THAILAND', '0854811780', '+66-38-348-642', NULL, NULL, NULL, NULL, NULL, 'Fon', 'Fon'),
  ('141', '67-157-HEC', 'HOKURIKU ENGINEERING CO.,LTD.', 'C', 'THAILAND', '02-184-9794-5', NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('140', '68-140-UTL', 'UTILIC ENGINEERING AND SUPPLY CO.,LTD.', 'C', 'THAILAND', '093-125-8867', NULL, NULL, NULL, NULL, NULL, NULL, 'Fon', 'Fon'),
  ('139', '67-156-K-Tech', 'K-Tech Industrial (Thailand) co.,Ltd.', 'C', 'THAILAND', '038 036 210', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('138', '67-155-PI', 'P I INDUSTRY LIMITED', 'C', 'THAILAND', '038 961 855', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('137', '67-154-KCK', 'GAYSORN INTERPARTS CO.,LTD.', 'C', 'THAILAND', '+66(0)21759240-43 #35', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('136', '67-153-BIG', 'BIG INNOVATION&SERVICE CO.,LTD.', 'C', 'THAILAND', '094-4943149', NULL, NULL, NULL, NULL, NULL, NULL, 'Fon', 'Fon'),
  ('134', '67-152-TTM', 'Thai Tech Matsuda Co., Ltd.', 'C', 'THAILAND', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('132', '66-151-YSPS', 'Ys Precision Stamping (Thailand) Co., Ltd.', 'C', 'THAILAND', '038-296-123', NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('131', '66-150-SLT', 'SUNLIT (THAILAND) CO.,LTD.', 'C', 'THAILAND', '033-017295-7', NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro')
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
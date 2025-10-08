INSERT INTO customers (
  kintone_record_id, customer_id, company_name, customer_rank,
  country, phone_number, fax_number, tax_id, payment_terms,
  address, website_url, notes, created_by, updated_by
) VALUES 
  ('130', '66-149-TNT', 'TAKANAWA (THAILAND) CO., LTD.', 'C', 'THAILAND', '035-744-077', NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('129', '66-148-SGT', 'SHONAN GIKEN (THAILAND) CO.,LTD.', 'C', 'THAILAND', '02-174-7474', NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('128', '66-147-SCT', 'SEKI CORP (THAILAND) CO., LTD.', 'C', 'THAILAND', '036-373-075', NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('127', '66-146-CTT', 'CHUBU TECHNO (THAILAND) CO. LTD.', 'C', 'THAILAND', '033-012-079 #111', NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('126', '66-145-CRT', 'C.R.TRADING & MACHINE TOOLS LIMITED PARTNERSHIP', 'C', 'Ayutthaya ', '081-5536386 ', NULL, NULL, NULL, NULL, NULL, NULL, 'Fon', 'Fon'),
  ('125', '66-144-HSM', 'HASUDAI MACHINERY Co., Ltd.', 'C', 'Bangkok', '02-0775576', '02-0775576', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('124', '66-143-BPS', 'BPS Best Part Supply Co., Ltd.', 'C', 'Thailand', '02-198-3097', '02-198-3098', NULL, NULL, NULL, NULL, NULL, 'Fon', 'Fon'),
  ('123', '66-142-SVPT', 'SERVICE PRESS (THAILAND) COMPANY LIMITED', 'C', 'Chonburi ', '081-7626791', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('122', '66-141-TSE', 'THAI SEIKA ELECTRIC COMPANY LIMITED', 'C', 'Samut Prakan', '0-2816-1200', '0-2461-1473', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('121', '66-140-SKE', 'Siam Koji Kikai Engineering Co., Ltd.', 'C', 'Samutprakarn', '02-0064757', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut')
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
INSERT INTO customers (
  kintone_record_id, customer_id, company_name, customer_rank,
  country, phone_number, fax_number, tax_id, payment_terms,
  address, website_url, notes, created_by, updated_by
) VALUES 
  ('100', '64-119-NHK', 'NHK SPRING (THAILAND) Co.,Ltd', 'B', 'Chachoengsao', '038-842830', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('98', '64-118-MWE', 'METAL W ENGINEERING CO.,LTD.', 'C', 'Pathum Thani', '087-0564445', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('97', '64-117-KCR', 'KCR GLOBAL CO.,LTD.', 'C', 'LOPBURI', '089-9623803', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Taro'),
  ('96', '64-116-SSK', 'SIAM SEIKEN CO.,LTD', 'C', 'Thailand', '08-009-1033', NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('95', '64-115-KJT', 'KANEZIN JAPAN (THAILAND)CO.,LTD', 'C', 'Samutprakarn', '02-1745111', '02-1745195', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('94', '64-114-CMP', 'CS Metal Parts Co.,Ltd.', 'C', 'Thailand', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Anut'),
  ('93', '64-113-SWT', 'SHIMADA WORKS (THAILAND) CO.,LTD', 'B', ' Chonburi ', '033-006123', '033-006127', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('92', '64-112-NTK', 'NTK CORPORATION ASIA CO., LTD.', 'C', 'Thailand', '+66(0)38-109-305', '+66(0)38-109-312', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('91', '64-111-YMT', 'YAMATO (THAILAND)CO.,LTD.', 'B', 'Thailand', '0-2908-1421-5　', '0-2908-1429', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('90', '64-110-SRM', 'SRM RIKEN CO.,LTD.', 'C', 'BANGKOK', '081-611-5337', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut')
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
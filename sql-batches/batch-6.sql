INSERT INTO customers (
  kintone_record_id, customer_id, company_name, customer_rank,
  country, phone_number, fax_number, tax_id, payment_terms,
  address, website_url, notes, created_by, updated_by
) VALUES 
  ('89', '64-109-RET', 'Ryosho Engineering(Thailand) Co.,Ltd.', 'B', 'Thailand', '02-670-0385', '02-670-0389', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Fon'),
  ('88', '64-108-RST', 'Ryosho (Thailand) Co.,Ltd.', 'B', 'Thailand', '02-670-0385', '02-670-0389', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Anut'),
  ('87', '64-101-ATH', 'Advanex (Thailand) Ltd ', 'B', 'Chonburi', '+66-38-079-980-2 #107', '+66-38-079-978-9 ', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('86', '64-100-EMT', 'ENDO METAL SLEEVE (Thailand) CO.,LTD', 'B', 'THAILAND', '038-575016-21', '038-575035', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Taro'),
  ('85', '63-105-ICT', 'IWATANI CORPORATION (THAILAND) Ltd.', 'C', 'Bangkok ', '02-2311764 #204', '02-2311769', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('84', '63-104-OOIM', 'OOIM CO., LTD.', 'C', 'Thailand', '(662) 174-7312-14', '(662) 174-7315', NULL, NULL, NULL, NULL, NULL, 'Fon', 'Anut'),
  ('82', '63-103-SUN', 'Sunstar Engineering (Thailand) Co.,Ltd.', 'C', 'Thailand', '02 324 0652', '02 324 0655', NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('81', '63-102-KTC', 'Kanaech (Thailand) Co., Ltd.', 'C', 'Thailand', '038-347013~4', NULL, NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('80', '63-101-NFP', 'Nishii Fine Press (Thailand) Co., Ltd.', 'C', 'Thailand', '03-844-7147-8', NULL, NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('79', '63-100-IIT', 'Ibuki Industrial (Thailand) Co.,Ltd.', 'C', 'Thailand', '02 136 4285', '02 136 4286', NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut')
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
INSERT INTO customers (
  kintone_record_id, customer_id, company_name, customer_rank,
  country, phone_number, fax_number, tax_id, payment_terms,
  address, website_url, notes, created_by, updated_by
) VALUES 
  ('45', '61-049-NOK', 'THAI NOK CO.,LTD. ( Head office )', 'B', 'THAILAND', '038-456-600', NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Anut'),
  ('44', '61-048-SHIT', 'SANSHIN HIGH TECHNOLOGY ( THAILAND )', 'B', 'THAILAND', '035-22658-61', '035-226923', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Anut'),
  ('43', '61-047-TID', 'THAI IKEDA MFG CO.,LTD.', 'C', 'THAILAND', '038-296328-30', '038-296-331', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('42', '61-046-MNB-BPI', 'NMB-MINEBEA THAI LIMITED  Bang Pa-In', 'B', 'THAILAND', '035-351439-48', '035-361460', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('41', '61-045-MEC', 'M E C MACHINERY ( THAILAND ) CO.,LTD.', 'C', 'Thailand', '02-1361691', '02-1361691', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('40', '61-044-P.P.', 'p.p.pinpoint limited partnership.', 'NULL', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('39', '60-043-YTM', 'YTM CO.,LTD.', 'NULL', NULL, '02-136-5218', '02-875-3327', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('38', '60-042-TGS', 'TIGER SUPPLY CO.,LTD. (Myanmar)', 'NULL', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('37', '60-039-C.C.S.', 'C.C.S.Engineering.Co.,Ltd.', 'NULL', NULL, '02-4436996 , 02-4436969', '02-443-6444', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('36', '60-038-SHS', 'SAHA SEIREN CO.,LTD.', 'NULL', NULL, '037-290245-48', '037-290249', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro')
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
INSERT INTO customers (
  kintone_record_id, customer_id, company_name, customer_rank,
  country, phone_number, fax_number, tax_id, payment_terms,
  address, website_url, notes, created_by, updated_by
) VALUES 
  ('78', '63-099-IWT', 'ISEWAN ( THAILAND ) CO.,LTD.', 'C', 'Thailand', '02-661-6404-5', '02-661-6406 ', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Anut'),
  ('77', '63-098-BCC', 'Bangkok Coil Center Co., Ltd.', 'C', 'Thailand', '02-021-6000 Ext. 6097', '02-021-6004', NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'MR.KORAKOT SUWANNASILP'),
  ('76', '63-097-TST', 'Togo Seisakusyo (Thailand) Co.,Ltd.', 'C', 'Thailand', '03 368 3555', '03 368 3556', NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'MR.KORAKOT SUWANNASILP'),
  ('75', '63-096-BPS', 'Bangkok Pacific Steel Co.,Ltd.', 'C', 'Thailand', '02 425 1000', '02 425 0111', NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('74', '63-095-LTI', 'LEO TOOLS INTERTRADE CO.,LTD.', 'C', 'Thailand', '02-1492120', NULL, NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('73', '63-094-DIT', 'Daikin Industries (Thailand) Ltd.', 'C', 'Thailand', '038-469-700', '038-469-798', NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('72', '63-093-MIL', 'MEYER INDUSTRIES LTD.', 'C', 'Thailand', '03 840 4200', NULL, NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('71', '63-092-KPC', 'KULTHORN PREMIER CO., LTD.', 'C', 'Thailand', '037-455516-22', '037-455-525', NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('70', '63-091-SUS', 'Standard Units Supply (Thailand) Co.,Ltd.', 'C', 'Thailand', '053-569-999', '053-569-950-51', NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('68', '63-090-HAS', 'HITACHI AUTOMOTIVE SYSTEMS CHONBURI LTD.', 'C', 'Thailand', '03-821-4389-94', NULL, NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut')
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
INSERT INTO customers (
  kintone_record_id, customer_id, company_name, customer_rank,
  country, phone_number, fax_number, tax_id, payment_terms,
  address, website_url, notes, created_by, updated_by
) VALUES 
  ('55', '62-079-NCP', 'Nidec Copal (Thailand) Co., Ltd.', 'C', 'Thailand', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Anut'),
  ('54', '62-078-MHT', 'Mitsui-High-tec(Thailand)Co.,Ltd.', 'C', 'Thailand', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Anut'),
  ('53', '62-057-PRV', 'PRV PRODUCTS CO.,LTD.', 'C', 'Thailand', '034-849931', '034-878944', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Anut'),
  ('52', '62-056-ONE', 'ONNUT ENGINEERING CO.,LTD.  ', 'C', 'Thailand', '02-170-8253', '02-170-8524', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro'),
  ('51', '62-055-MTH', 'MARELLI CABIN COMFORT ( THAILAND ) CO.,LTD.', 'C', 'Thailand', '038-210129 Ext.373', '038-210-140', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Anut'),
  ('50', '62-054-NET', 'NIDEC ELECTRONICS ( THAILAND ) CO.,LTD.', 'C', 'Thailand', '+66-35-330-741-4 #5420 (automatic)  Ext.2022', '+66-35-330-746', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Anut'),
  ('49', '62-053-PNT', 'PNT MACHINERY ( THAILAND ) CO.,LTD.', 'C', 'Thailand', '082-6135478 / 081-3013344', NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Anut'),
  ('48', '61-052-MNB-BW', 'NMB-MINEBEA THAI LIMITED  BAN WA', 'C', 'Thailand', '035-351732', NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Anut'),
  ('47', '61-051-NDT', 'NOHARA DENKEN ( THAILAND ) CO.,LTD.', 'C', 'Thailand', '038-119534', NULL, NULL, NULL, NULL, NULL, NULL, 'Taro', 'Anut'),
  ('46', '61-050-TRD', 'TECHNOS R&D ( THAILAND ) CO.,LTD. ', 'A', 'Thailand', '038-199-850-2', '038-199-853', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Anut')
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
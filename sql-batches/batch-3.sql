INSERT INTO customers (
  kintone_record_id, customer_id, company_name, customer_rank,
  country, phone_number, fax_number, tax_id, payment_terms,
  address, website_url, notes, created_by, updated_by
) VALUES 
  ('120', '66-139-GTS', 'Good Tool & Supply Co.,Ltd.', 'C', 'Chonburi', '038-047488 ', '038-047489', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('119', '66-138-KRANES', 'KRANES CO.,LTD.', 'C', 'Bangna,Bangkok', '02-7448467-8 ', '02-7448466', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('118', '66-137-CNK', 'C.CHAICHANAKIT ENGINEERING CO.,LTD.', 'B', 'THAILAND', '034812933-5', '034812541', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('117', '66-136-ACE', 'AUTO CLAMP  & ENGINEERING  Co.,Ltd.', 'C', 'Bangkok', '02-0127437-9', '02-012-7440', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('116', '66-135-IGMT', 'IWATANI GAS AND MACHINERY (THAILAND) LTD.', 'C', 'Bangkok ', '02-2311764 #204', '02-2311769', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Fon'),
  ('115', '66-134-VNT', 'VN TECH ENGINEERING CO.,LTD', 'B', 'Bangpheeyai', '02-3460200', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('114', '66-133-BTT', 'BESTEX(THAILAND)CO.,LTD', 'B', 'Pranakorn Sri Ayutthaya', '035-330940', '035-330647', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('113', '66-132-SDN', 'SOODE NAGANO (THAILAND) CO.,LTD.', 'B', 'Thailand', '035352671-4', '035352677-8', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('112', '66-131-KJN', 'Karnchana lohakarn Co., Ltd.', 'B', 'Thailand', '034-854-583-6', NULL, NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('111', '66-130-NSP', 'Nippon Super Precision Co., Ltd.', 'C', 'Thailand', '035-352-446-48 Ext : 0,123', '035-352-449', NULL, NULL, NULL, NULL, NULL, 'Taro', 'Taro')
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
INSERT INTO customers (
  kintone_record_id, customer_id, company_name, customer_rank,
  country, phone_number, fax_number, tax_id, payment_terms,
  address, website_url, notes, created_by, updated_by
) VALUES 
  ('67', '63-089-MHI', 'MITSUBISHI HEAVY INDUSTRIES-MAHAJAK AIR CONDITIONERS CO., LTD.,', 'C', 'Thailand', '02-326-0411', NULL, NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('66', '63-088-FTM', 'F-TECH MFG. (THAILAND) LTD.', 'C', 'Thailand', '035 746 700', '035 746 710', NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('65', '63-087-TIP', 'THAI INDUSTRIAL PARTS LTD.', 'C', 'Thailand', '02-397-9000', '02-397-9010-11', NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('64', '63-086-PAT', 'Panasonic Appliances (Thailand) Co.,Ltd.', 'C', 'Thailand', '038 570 010-19', '038-570-021', NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('63', '63-085-SMC', 'SHIBATA MANUFACTURING CO.,LTD.', 'C', 'Thailand', '(66)2 706-1986-89', '(66)2 706-1990', NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('62', '63-084-SMS', 'Shimizu Metal Stamping (Thailand) Co.,Ltd', 'C', 'Thailand', '03 300 6108', '033-006129', NULL, NULL, NULL, NULL, NULL, 'MR.KORAKOT SUWANNASILP', 'Anut'),
  ('61', '63-083-TLC', 'THAI LEAKLESS CORPORATION LTD.', 'C', 'Songkhla', '074-272700', '074-272710', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('59', '63-082-KTT', 'KOTOBUKI TEC (thailand)CO.,LTD.', 'C', 'Chonburi', '038-198-050-3', '038-198-054', NULL, NULL, NULL, NULL, NULL, 'Anut', 'Anut'),
  ('58', '63-081-SAM', 'SIAM ADVANCE METAL CO.,LTD. ', 'C', 'Thailand ', '038-111-379', '038-111378', NULL, NULL, NULL, NULL, NULL, 'Fon', 'Anut'),
  ('57', '63-080-PPT', 'Papas (Thailand ) Co.,Ltd.', 'C', 'Thailand', '038-212-260-1 #110', '038-212-262', NULL, NULL, NULL, NULL, NULL, 'Fon', 'Anut')
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
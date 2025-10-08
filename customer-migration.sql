[dotenv@17.2.3] injecting env (31) from .env.local -- tip: 🗂️ backup and recover secrets: https://dotenvx.com/ops
=== 全顧客データの移行準備 ===

Kintone API Request: {
  url: 'https://md34y.cybozu.com/k/v1/records.json?app=7',
  appId: '7',
  hasApiToken: true,
  apiTokenLength: 40,
  method: 'GET'
}
Kintoneから100件の顧客データを取得しました

10個のバッチに分割しました（各バッチ最大10件）

-- バッチ 1/10 (10件)
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


-- バッチ 2/10 (10件)
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


-- バッチ 3/10 (10件)
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


-- バッチ 4/10 (10件)
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


-- バッチ 5/10 (10件)
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


-- バッチ 6/10 (10件)
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


-- バッチ 7/10 (10件)
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


-- バッチ 8/10 (10件)
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


-- バッチ 9/10 (10件)
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


-- バッチ 10/10 (10件)
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


-- 完了: 全100件の顧客データの移行SQLを生成しました

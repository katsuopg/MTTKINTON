/**
 * CS IDから顧客短縮名を抽出するユーティリティ
 *
 * 例:
 * - "55-001-MGT" → "MGT"
 * - "56-002-SKT" → "SKT"
 * - "57-012-MNB-LP" → "MNB-LP"
 */

/**
 * CS IDから顧客短縮名を抽出
 * @param csId CS ID (例: "56-002-SKT")
 * @returns 顧客短縮名 (例: "SKT")
 */
export function extractCsName(csId: string | undefined | null): string {
  if (!csId) return '';

  // パターン: XX-XXX- (2桁数字-3桁数字-)を削除
  const match = csId.match(/^\d{2}-\d{3}-(.+)$/);
  if (match) {
    return match[1];
  }

  // パターンに一致しない場合は元の値を返す
  return csId;
}

/**
 * CS_Nameまたは抽出された短縮名を取得
 * @param csName Kintone Cs_Nameフィールドの値
 * @param csId CS IDの値（フォールバック用）
 * @returns 顧客短縮名
 */
export function getCustomerShortName(csName: string | undefined | null, csId: string | undefined | null): string {
  // Cs_Nameがあればそれを使用
  if (csName) return csName;

  // なければCS IDから抽出
  return extractCsName(csId);
}

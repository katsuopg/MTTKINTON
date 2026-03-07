/**
 * ilike検索用のエスケープ処理
 * PostgreSQLのLIKE/ILIKEの特殊文字（%, _, \）をエスケープ
 */
export function escapeIlike(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * エスケープ済みの検索パターンを生成（部分一致）
 */
export function ilikePattern(input: string): string {
  return `%${escapeIlike(input)}%`;
}

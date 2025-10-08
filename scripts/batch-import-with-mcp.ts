import { readFileSync } from 'fs';
import { join } from 'path';

// SQLファイルを読み込んでバッチごとに分割
const sqlContent = readFileSync(join(process.cwd(), 'customer-migration.sql'), 'utf-8');

// バッチを抽出する正規表現
const batchRegex = /INSERT INTO customers[\s\S]*?updated_at = NOW\(\);/g;

const batches: string[] = [];
let match;

while ((match = batchRegex.exec(sqlContent)) !== null) {
  batches.push(match[0]); // マッチした全体を抽出
}

console.log(`抽出されたバッチ数: ${batches.length}`);

// 各バッチの最初の数行を表示
batches.forEach((batch, index) => {
  const lines = batch.split('\n');
  console.log(`\n=== バッチ ${index + 1} ===`);
  console.log(`最初の3行:`);
  console.log(lines.slice(0, 3).join('\n'));
  console.log(`... (${lines.length}行)`);
});

// バッチごとのSQLファイルを生成
import { writeFileSync } from 'fs';

batches.forEach((batch, index) => {
  const filename = `batch-${index + 1}.sql`;
  writeFileSync(join(process.cwd(), 'sql-batches', filename), batch);
  console.log(`${filename} を生成しました`);
});
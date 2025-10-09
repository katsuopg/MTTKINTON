import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const domain = process.env.KINTONE_DOMAIN;
const token = process.env.KINTONE_API_TOKEN_INVOICE;
const appId = process.env.KINTONE_APP_INVOICE_MANAGEMENT || '26';

if (!domain || !token) {
  console.error('Kintone環境変数が設定されていません。');
  process.exit(1);
}

type InvoiceRecord = {
  $id: { value: string };
  文字列__1行_?: { value?: string };
  Work_No?: { value?: string };
  文字列__1行__3?: { value?: string };
  [key: string]: any;
};

async function fetchRecords(customerId: string) {
  let offset = 0;
  const limit = 500;
  let total = 0;
  const sample: InvoiceRecord[] = [];

  while (true) {
    const query = `文字列__1行__3 = "${customerId}" order by $id asc limit ${limit} offset ${offset}`;
    const response = await fetch(`https://${domain}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(query)}`, {
      headers: {
        'X-Cybozu-API-Token': token,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Fetch failed for ${customerId}: ${response.status} ${response.statusText} ${text}`);
    }

    const data = await response.json();
    const records: InvoiceRecord[] = data.records ?? [];
    total += records.length;
    if (sample.length === 0 && records.length > 0) {
      sample.push(...records.slice(0, 3));
    }

    if (records.length < limit) {
      break;
    }

    offset += limit;
  }

  console.log(`${customerId}: ${total}`);
  if (sample.length > 0) {
   sample.forEach((record, index) => {
      const workNo = record.文字列__1行_?.value || record.Work_No?.value || 'N/A';
      const csId = record.文字列__1行__3?.value;
      const keys = Object.keys(record).filter((key) => !key.startsWith('$'));
      const lookup = record.Lookup?.value;
      console.log(`  [${index}] id=${record.$id?.value} Work_No=${workNo}, CS_ID=${csId}, Lookup=${lookup}`);
      console.log(`      keys: ${keys.join(', ')}`);
    });
  }

  return total;
}

async function main() {
  const ids = process.argv.slice(2);
  if (ids.length === 0) {
    console.log('顧客IDを引数で指定してください。例: tsx scripts/debug-invoice-csid-count.ts 66-141-SVPT');
    process.exit(0);
  }

  for (const id of ids) {
    await fetchRecords(id);
  }
}

main().catch((error) => {
  console.error('エラー:', error);
  process.exit(1);
});

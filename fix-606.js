const fs = require('fs');

// ファイルパスを指定
const filePath = '/Users/taro/PG/MTTkinton/src/app/[locale]/(auth)/customers/[id]/CustomerDetailContent.tsx';

// ファイルを読み込む
let content = fs.readFileSync(filePath, 'utf8');

// 606-607行目の問題を修正
content = content.replace(
  `                        </th>
                        $2 : language === 'th' ? 'จำนวนเงิน' : 'Amount'}
                        </th>`,
  `                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ja' ? '金額' : language === 'th' ? 'จำนวนเงิน' : 'Amount'}
                        </th>`
);

// ファイルに書き込む
fs.writeFileSync(filePath, content);
console.log('Fixed line 606-607');
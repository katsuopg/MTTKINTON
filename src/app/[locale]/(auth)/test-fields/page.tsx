import { getQuotationFields, generateTypeDefinition } from '@/lib/kintone/field-info';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface TestFieldsPageProps {
  params: {
    locale: string;
  };
}

export default async function TestFieldsPage({ params }: TestFieldsPageProps) {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${params.locale}/login`);
  }

  let fields: any[] = [];
  let typeDefinition = '';
  let errorMessage = '';

  try {
    // 見積もり管理アプリのフィールド情報を取得
    fields = await getQuotationFields();
    // TypeScript型定義を生成
    typeDefinition = generateTypeDefinition('Quotation', fields);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  }

  return (
    <div className="py-4 px-4">
      <h1 className="text-2xl font-bold mb-6">見積もり管理 - フィールド情報</h1>
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          エラー: {errorMessage}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">フィールド一覧</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  フィールドコード
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ラベル
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイプ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  必須
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  選択肢/参照
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fields.map((field, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {field.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {field.label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {field.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {field.required ? (
                      <span className="text-red-600 font-semibold">必須</span>
                    ) : (
                      <span className="text-gray-400">任意</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {field.options ? (
                      <div>
                        <p className="font-medium">選択肢:</p>
                        <ul className="text-xs mt-1">
                          {field.options.slice(0, 5).map((option: string, idx: number) => (
                            <li key={idx}>• {option}</li>
                          ))}
                          {field.options.length > 5 && (
                            <li className="text-gray-400">他 {field.options.length - 5} 件...</li>
                          )}
                        </ul>
                      </div>
                    ) : field.referenceTable ? (
                      <div className="text-xs">
                        <p>参照App: {field.referenceTable.appId}</p>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">TypeScript型定義（自動生成）</h2>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            <code>{typeDefinition}</code>
          </pre>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          この型定義をtypes/kintone.tsにコピーして使用できます。
        </p>
      </div>
    </div>
  );
}
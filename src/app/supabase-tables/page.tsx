'use client';

import { useEffect, useState } from 'react';

interface TableInfo {
  table_name: string;
  table_type: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export default function SupabaseTablesPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/supabase/tables');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setTables(data.tables || []);
      }
    } catch (err) {
      setError('Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const fetchColumns = async (tableName: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/supabase/tables?table=${tableName}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setColumns(data.columns || []);
        setSelectedTable(tableName);
      }
    } catch (err) {
      setError('Failed to fetch columns');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Tables</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tables List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Tables</h2>
          {loading && !selectedTable ? (
            <p>Loading tables...</p>
          ) : (
            <ul className="space-y-2">
              {tables.map((table) => (
                <li
                  key={table.table_name}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedTable === table.table_name
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => fetchColumns(table.table_name)}
                >
                  <div className="font-medium">{table.table_name}</div>
                  <div className="text-sm text-gray-600">{table.table_type}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Columns Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {selectedTable ? `Columns: ${selectedTable}` : 'Select a table'}
          </h2>
          {selectedTable && (
            <div>
              {loading ? (
                <p>Loading columns...</p>
              ) : (
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Column Name</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Nullable</th>
                      <th className="text-left py-2">Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((column) => (
                      <tr key={column.column_name} className="border-b">
                        <td className="py-2">{column.column_name}</td>
                        <td className="py-2">{column.data_type}</td>
                        <td className="py-2">{column.is_nullable}</td>
                        <td className="py-2">{column.column_default || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
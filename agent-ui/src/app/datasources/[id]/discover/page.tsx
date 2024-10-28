'use client';
import React, { useEffect, useState } from 'react';
import { DatasourceContextCard } from '@/components/datasource/DatasourceContextCard';
import { DataSourceType } from '@/types/DataSource';
import { useTables } from '@/hooks/useTables';
import { TableList } from '@/components/tables/TableList';
import { tableService } from '@/services/tableService';
import { message } from 'antd';

interface Props {
  params: {
    id: string;
    name: string;
    type: DataSourceType;
  }
}

export default function DiscoverPage({ params }: { params: { id: string } }) {
  const [datasource, setDatasource] = useState<{
    name: string;
    type: DataSourceType;
    context?: {
      _id: string;
      tables: Array<{
        tableName: string;
        tableOutput: string;
        tableDescription: string;
        tableOutputUserDescription: string;
      }>;
    };
  } | null>(null);

  useEffect(() => {
    const fetchDatasource = async () => {
      try {
        const data = await tableService.fetchDatasource(params.id);
        setDatasource(data);
      } catch (error) {
        console.error('Error loading datasource:', error);
        message.error('Failed to load datasource details');
      }
    };
    fetchDatasource();
  }, [params.id]);

  const {
    tables,
    loading,
    searchTerm,
    setSearchTerm,
    filteredTables,
    datasourceContext,
    expandedTables,
    loadTables,
    handleCheckboxChange,
    removeUncheckedTables,
    initContext,
    toggleTableExpansion
  } = useTables(params.id);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        <DatasourceContextCard datasource={datasource} />
        <button
          onClick={loadTables}
          disabled={loading}
          className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </>
          ) : 'Load Tables'}
        </button>

        {tables && Object.keys(tables).length > 0 && (
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Tables</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Select the tables you want to keep.</p>
              <input
                type="text"
                placeholder="Filter tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-500"
              />
            </div>

            <TableList
              filteredTables={filteredTables}
              onCheckboxChange={handleCheckboxChange}
              expandedTables={expandedTables}
              onToggleExpansion={toggleTableExpansion}
              datasourceContext={datasourceContext}
            />

            <div id="button-init-context" className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-4">
              <button
                onClick={async () => {
                  await initContext();
                  window.location.reload();
                }}
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Init context
              </button>

              <button
                onClick={removeUncheckedTables}
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Remove Unchecked Tables
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { IDataSourceContext } from '@/types/DataSourceContext';

export const tableService = {
  async fetchDatasource(datasourceId: string) {
    const response = await fetch(`/api/datasources/${datasourceId}/discover/context`);
    if (!response.ok) {
      throw new Error('Failed to fetch datasource details');
    }
    return await response.json();
  },

  async fetchTables(datasourceId: string) {
    const response = await fetch(`/api/datasources/${datasourceId}/discover/tables`);
    if (!response.ok) {
      throw new Error('Failed to fetch tables');
    }
    return await response.json();
  },

  async initializeContext(datasourceId: string, tableNames: string[]) {
    const response = await fetch(`/api/datasources/${datasourceId}/discover/context`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNames }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to initialize context');
    }
    return await response.json();
  }
};

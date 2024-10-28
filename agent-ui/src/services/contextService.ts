import { IDataSourceContext } from '@/types/DataSourceContext';

export const contextService = {
  async updateContext(datasourceId: string, context: IDataSourceContext) {
    const response = await fetch(`/api/datasources/${datasourceId}/discover/context`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(context),
    });
    if (!response.ok) {
      throw new Error('Failed to update datasource context');
    }
    return await response.json();
  },

};

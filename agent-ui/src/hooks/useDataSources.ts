import { useState, useEffect } from 'react';

interface DataSource {
  _id: string;
  name: string;
}

export const useDataSources = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDataSources = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/datasources');
        if (!response.ok) {
          throw new Error('Failed to fetch data sources');
        }
        const data = await response.json();
        setDataSources(data.map((ds: any) => ({
          _id: ds._id,
          name: ds.name
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDataSources();
  }, []);

  return { dataSources, loading, error };
};

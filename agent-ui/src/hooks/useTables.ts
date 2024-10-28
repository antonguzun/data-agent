import { useState, useMemo } from 'react';
import { message } from 'antd';
import { tableService } from '@/services/tableService';
import { IDataSourceContext } from '@/types/DataSourceContext';

interface TableState {
  tableName: string;
  checked: boolean;
}

export function useTables(datasourceId: string) {
  const [tables, setTables] = useState<{ [key: string]: TableState }>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [datasourceContext, setDatasourceContext] = useState<IDataSourceContext>({ _id: '', tables: [] });
  const [expandedTables, setExpandedTables] = useState<{ [key: string]: boolean }>({});

  const filteredTables = useMemo(() => {
    return Object.values(tables).filter(table =>
      table.tableName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tables, searchTerm]);

  const loadTables = async () => {
    setLoading(true);
    try {
      const data = await tableService.fetchTables(datasourceId);
      const tbls = data.tableNames.reduce((acc: { [key: string]: TableState }, tableName: string) => {
        acc[tableName] = { tableName, checked: false };
        return acc;
      }, {});
      setTables(tbls);
    } catch (error) {
      console.error('Error loading tables:', error);
      message.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (tableName: string) => {
    setTables(prevTables => ({
      ...prevTables,
      [tableName]: {
        ...prevTables[tableName],
        checked: !prevTables[tableName].checked
      }
    }));
  };

  const removeUncheckedTables = () => {
    setTables(prevTables => {
      return Object.entries(prevTables).reduce((acc, [tableName, table]) => {
        if (table.checked) {
          acc[tableName] = table;
        }
        return acc;
      }, {} as typeof prevTables);
    });
  };

  const initContext = async () => {
    setLoading(true);
    try {
      const checkedTableNames = Object.keys(tables).filter(tableName => tables[tableName].checked);
      const { context } = await tableService.initializeContext(datasourceId, checkedTableNames);
      setDatasourceContext(context);
    } catch (error) {
      console.error('Error initializing context:', error);
      message.error('Failed to initialize context');
    } finally {
      setLoading(false);
    }
  };

  const toggleTableExpansion = (tableName: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  return {
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
  };
}

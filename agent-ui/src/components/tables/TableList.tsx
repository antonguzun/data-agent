import React from 'react';
import { TableListItem } from './TableListItem';

interface TableListProps {
  filteredTables: Array<{ tableName: string; checked: boolean }>;
  onCheckboxChange: (tableName: string) => void;
  expandedTables: { [key: string]: boolean };
  onToggleExpansion: (tableName: string) => void;
  datasourceContext: { tables: Array<{ tableName: string; tableOutput?: string }> };
}

export const TableList: React.FC<TableListProps> = ({
  filteredTables,
  onCheckboxChange,
  expandedTables,
  onToggleExpansion,
  datasourceContext
}) => (
  <ul className="divide-y divide-gray-200">
    {filteredTables.map((table) => (
      <TableListItem
        key={table.tableName}
        table={table}
        onCheckboxChange={onCheckboxChange}
        expanded={expandedTables[table.tableName]}
        onToggleExpansion={onToggleExpansion}
        tableOutput={datasourceContext.tables.find(t => t.tableName === table.tableName)?.tableOutput}
      />
    ))}
  </ul>
);

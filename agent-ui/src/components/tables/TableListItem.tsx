import React from 'react';

interface TableListItemProps {
  table: { tableName: string; checked: boolean };
  onCheckboxChange: (tableName: string) => void;
  expanded: boolean;
  onToggleExpansion: (tableName: string) => void;
  tableOutput?: string;
}

export const TableListItem: React.FC<TableListItemProps> = ({
  table,
  onCheckboxChange,
  expanded,
  onToggleExpansion,
  tableOutput
}) => (
  <li className="px-4 py-4 sm:px-6">
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={table.checked}
        onChange={() => onCheckboxChange(table.tableName)}
        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
      />
      <label className="ml-3 block text-sm font-medium text-gray-700">
        {table.tableName}
      </label>
    </div>
    {tableOutput && (
      <div 
        className="mt-2 ml-7 text-sm text-gray-500 cursor-pointer"
        onClick={() => onToggleExpansion(table.tableName)}
      >
        <p className={expanded ? '' : 'line-clamp-2'}>
          {tableOutput}
        </p>
        <span className="text-indigo-600 hover:text-indigo-800">
          {expanded ? 'Show less' : 'Show more'}
        </span>
      </div>
    )}
  </li>
);

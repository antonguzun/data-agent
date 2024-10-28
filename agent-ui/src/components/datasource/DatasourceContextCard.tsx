'use client';
import React, { useState } from 'react';
import { DataSourceType } from '@/types/DataSource';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { PencilIcon } from '@heroicons/react/24/outline';
import { contextService } from '@/services/contextService';
import { message } from 'antd';

interface DatasourceContextCardProps {
  datasource: {
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
  } | null;
}

export const DatasourceContextCard: React.FC<DatasourceContextCardProps> = ({ datasource }) => {
  const [expandedTables, setExpandedTables] = useState<Set<number>>(new Set());
  const [editingTable, setEditingTable] = useState<number | null>(null);
  const [editedDescriptions, setEditedDescriptions] = useState<{ [key: number]: string }>({});

  const handleDescriptionEdit = (index: number, description: string) => {
    setEditedDescriptions(prev => ({
      ...prev,
      [index]: description
    }));
  };

  const handleDescriptionSave = async (index: number) => {
    if (!datasource?.context) return;
    
    try {
      const updatedTables = [...datasource.context.tables];
      updatedTables[index] = {
        ...updatedTables[index],
        tableOutputUserDescription: editedDescriptions[index] ?? ''
      };

      const updatedContext = {
        ...datasource.context,
        tables: updatedTables
      };

      await contextService.updateContext(datasource.context._id, updatedContext);
      message.success('Description saved successfully');
      setEditingTable(null);
      window.location.reload();
    } catch (error) {
      console.error('Error saving description:', error);
      message.error('Failed to save description');
    }
  };

  const toggleTableExpansion = (index: number) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTables(newExpanded);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };
  return (
    <div id="datasource-context-card">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Discover Data Source</h1>
      <p className="text-lg text-gray-600 mb-4">Data Source Name: {datasource?.name || 'Loading...'}</p>
      <p className="text-lg text-gray-600 mb-4">Data Source Type: {datasource?.type || 'Loading...'}</p>

      {datasource?.context && (
        <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Current Context</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Context ID: {datasource.context._id}</p>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-medium text-gray-900">Tables</h4>
              </div>
              {(datasource.context.tables).map((table, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-md mb-2">
                  <p className="font-medium text-indigo-600">{table.tableName}</p>
                  <div className="mt-2">
                    {table.tableDescription && (
                      <p className="text-sm text-gray-600">
                        Description: {expandedTables.has(index) ? table.tableDescription : truncateText(table.tableDescription)}
                      </p>
                    )}
                    {table.tableOutput && (
                      <div id="table-output">
                        <p className="text-gray-800">Table Output</p>
                        <p className="text-sm text-gray-600 bg-gray-300">
                          Output: {expandedTables.has(index) ? table.tableOutput : truncateText(table.tableOutput)}
                        </p>

                      </div>
                    )}
                    <div id="table-user-description" className="mt-2">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-800">Table User Description</p>
                        <button
                          onClick={() => setEditingTable(index)}
                          className="p-1 text-gray-800 hover:text-indigo-600"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                      {editingTable === index ? (
                        <div className="mt-1">
                          <textarea
                            className="w-full p-2 border rounded-md text-sm text-gray-600"
                            value={editedDescriptions[index] ?? table.tableOutputUserDescription ?? ''}
                            onChange={(e) => handleDescriptionEdit(index, e.target.value)}
                            rows={3}
                          />
                          <div className="mt-2 flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingTable(null)}
                              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDescriptionSave(index)}
                              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p id="user-description" className={`text-sm ${!table.tableOutputUserDescription ? 'text-red-600' : 'text-gray-600'} bg-gray-100 p-2 rounded-md`}>
                          {table.tableOutputUserDescription ? 
                            (expandedTables.has(index) ? table.tableOutputUserDescription : truncateText(table.tableOutputUserDescription))
                            : 'No description available. Additional information about the table would be helpful.'}
                        </p>
                      )}
                    </div>
                    {(table.tableDescription || table.tableOutput || table.tableOutputUserDescription) && (
                      <button
                        onClick={() => toggleTableExpansion(index)}
                        className="mt-2 flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        {expandedTables.has(index) ? (
                          <>
                            Show Less
                            <ChevronUpIcon className="h-4 w-4 ml-1" />
                          </>
                        ) : (
                          <>
                            Show More
                            <ChevronDownIcon className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { useState } from 'react';
import { ToolCallEvent, ToolResultEvent } from '../../../types/events';
import { extractColumnsFromQuery, highlightSQL, formatSQL } from '../../../utils/sqlUtils';
import SpreadGrid from 'react-spread-grid';
import { HeartIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface ToolCallRendererProps {
  event: ToolCallEvent;
  matchingToolResult?: ToolResultEvent;
  ws: WebSocket | null;
}

export function ToolCallRenderer({ event, matchingToolResult, ws }: ToolCallRendererProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuery, setEditedQuery] = useState(event.parameters.query);

  const handleLikeSQL = () => {
    if (ws) {
      ws.send(JSON.stringify({
        type: 'like_sql',
        eventId: event.id
      }));
    }
  };
  const renderToolParameters = () => {
    if (event.tool_name === 'execute_sql_query') {
      return (
        <div id='sql-code' className="space-y-2 relative">
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
              title="Fix SQL query"
            >
              <PencilSquareIcon className="w-5 h-5 text-gray-600 hover:text-blue-500" />
            </button>
            <button
              onClick={handleLikeSQL}
              className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
              title="Like this SQL query"
            >
              <HeartIcon className="w-5 h-5 text-gray-600 hover:text-red-500" />
            </button>
          </div>
          {isEditing ? (
            <div className="relative text-gray-600">
              <textarea
                value={editedQuery}
                onChange={(e) => setEditedQuery(e.target.value)}
                className="w-full h-32 p-2 text-sm font-mono border rounded"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    if (ws) {
                      ws.send(JSON.stringify({
                        type: 'fix_sql',
                        eventId: event.id,
                        query: editedQuery
                      }));
                    }
                    event.parameters.query = editedQuery;
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditedQuery(event.parameters.query);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <pre className="text-sm p-2 rounded overflow-x-auto">
              <code
                className="hljs language-sql"
                dangerouslySetInnerHTML={{
                  __html: highlightSQL(formatSQL(event.parameters.query))
                }}
              />
            </pre>
          )}
          <div className="text-xs text-gray-500">
            Data Source ID: {event.parameters.datasourceId}
          </div>
        </div>
      );
    }

    return (
      <pre className="text-sm bg-gray-800 p-2 rounded">
        {JSON.stringify(event.parameters, null, 2)}
      </pre>
    );
  };

  const renderToolResult = () => {
    if (!matchingToolResult) return null;

    try {
      const data = JSON.parse(matchingToolResult.output);
      if (Array.isArray(data) && data.length > 0) {
        const columns = event.tool_name === 'execute_sql_query'
          ? extractColumnsFromQuery(event.parameters.query)
          : [];

        if (data.length === 1) {
          return (
            <div className="bg-gray-800 p-4 rounded">
              {columns.length > 0 && (
                <div className="mb-3 text-sm text-gray-500">
                  Columns: {columns.join(', ')}
                </div>
              )}
              {Object.entries(data[0]).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <span className="text-gray-400 font-semibold">{key}: </span>
                  <span className="text-gray-200">{String(value)}</span>
                </div>
              ))}
            </div>
          );
        }

        return (
          <div className="overflow-x-auto">
            <SpreadGrid data={data} />
          </div>
        );
      }
    } catch (e) {
      // Fall through to default rendering
    }

    return (
      <pre className="text-sm bg-gray-800 p-2 rounded">
        {matchingToolResult.output}
      </pre>
    );
  };

  return (
    <div className="border-l-4 border-yellow-500 pl-2 mb-2">
      <div className="font-bold text-yellow-500">
        Tool Call: {event.tool_name}
      </div>
      {renderToolParameters()}
      {matchingToolResult && (
        <div className="mt-2 border-l-4 border-green-500 pl-2">
          <div className="font-bold text-green-500">Result:</div>
          <div className="mt-2">
            {renderToolResult()}
          </div>
        </div>
      )}
    </div>
  );
}

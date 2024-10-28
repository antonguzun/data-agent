import { UsedTool } from '@/types/Hypothesis';
import { useState } from 'react';

interface SqlResultsProps {
  tool: UsedTool;
  toolIndex: number;
}

export const SqlResults = ({ tool, toolIndex }: SqlResultsProps) => {
  const [showAll, setShowAll] = useState(false);
  const formatSqlQuery = (query: string) => {
    return query.split(/\s+(?=(?:SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT))/gi).join('\n');
  };

  const renderResults = (content: string) => {
    try {
      const parsedContent = JSON.parse(content);
      if (!Array.isArray(parsedContent)) {
        return <li className="pl-3 pr-4 py-3 text-sm text-gray-500">Invalid data format</li>;
      }
      
      const displayData = showAll ? parsedContent : parsedContent.slice(0, 5);
      return (
        <>
          {displayData.map((result: any, idx: number) => (
            <li key={idx} className="pl-3 pr-4 py-3 flex items-center gap-4 text-sm">
              {Array.isArray(result) && result.map((value: any, colIdx: number) => (
                <span key={colIdx} className="flex-1">{value}</span>
              ))}
            </li>
          ))}
          {parsedContent.length > 5 && (
            <li className="pl-3 pr-4 py-2 bg-gray-50">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showAll ? 'Show Less' : `Show All (${parsedContent.length} items)`}
              </button>
            </li>
          )}
        </>
      );
    } catch (error) {
      return <li className="pl-3 pr-4 py-3 text-sm text-gray-500">Unable to parse results</li>;
    }
  };

  return (
    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
      <dt className="text-sm font-medium text-gray-500">SQL Query {toolIndex + 1}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
        {tool.name === "execute_sql_query" ? (
          <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap">
            {formatSqlQuery(tool.query)}
          </pre>
        ) : (
          <pre className="bg-gray-100 p-2 rounded">{tool.query}</pre>
        )}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Results:</h4>
          <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
            {renderResults(tool.content)}
          </ul>
        </div>
      </dd>
    </div>
  );
};

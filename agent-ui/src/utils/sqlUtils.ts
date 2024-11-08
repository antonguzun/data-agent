import hljs from 'highlight.js/lib/core';
import sql from 'highlight.js/lib/languages/sql';

hljs.registerLanguage('sql', sql);

export const extractColumnsFromQuery = (sqlQuery: string): string[] => {
  const query = sqlQuery.toLowerCase();
  if (query.includes('select') && query.includes('from')) {
    const selectPart = query.split('from')[0].replace('select', '').trim();
    return selectPart.split(',').map(col => {
      const lastPart = col.trim().split(' ').pop() || '';
      const withoutAs = lastPart.split(' as ').pop() || '';
      return withoutAs.replace(/["`]/g, '').trim();
    });
  }
  return [];
};

export const highlightSQL = (query: string): string => {
  return hljs.highlight(query, { language: 'sql' }).value;
};
import { format } from 'sql-formatter';

export function formatSQL(sql: string): string {
  return format(sql, {
    language: 'sql',
    uppercase: true,
    indentStyle: 'standard'
  });
}

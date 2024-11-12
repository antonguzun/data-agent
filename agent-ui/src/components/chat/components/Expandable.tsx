import { useState } from 'react';
import { ExpandableProps } from '../../../types/events';

export function Expandable({ title, children }: ExpandableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer hover:text-blue-600 flex items-center gap-1"
      >
        <span>{isExpanded ? '▼' : '▶'}</span>
        {title}
      </div>
      {isExpanded && (
        <div className="mt-2 pl-4">
          {children}
        </div>
      )}
    </div>
  );
}

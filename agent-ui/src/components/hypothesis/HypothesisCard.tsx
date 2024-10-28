import { Hypothesis } from '@/types/Hypothesis';
import { SqlResults } from './SqlResults';
import { useState } from 'react';

interface HypothesisCardProps {
  hypothesis: Hypothesis;
}

export const HypothesisCard = ({ hypothesis }: HypothesisCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg leading-6 font-medium text-gray-900">{hypothesis.hypothesis_name}</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{hypothesis.hypothesis_main_idea}</p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isExpanded ? 'Hide Research Details' : 'Show Research Details'}
          </button>
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-900">Short summary: {hypothesis.short_summary}</p>
          <p className="mt-2 text-sm text-gray-900">
            Support strength: {' '}
            <span className={`font-semibold ${hypothesis.support_strength === 'weak' ? 'text-red-600' : 'text-green-600'}`}>
              {hypothesis.support_strength}
            </span>
          </p>
        </div>
      </div>
      {isExpanded && (
        <div id="hypothesis-research-plan" className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {hypothesis.used_tools.map((tool, toolIndex) => (
              <SqlResults key={toolIndex} tool={tool} toolIndex={toolIndex} />
            ))}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Research Summary</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <p>{hypothesis.research_summary}</p>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
};

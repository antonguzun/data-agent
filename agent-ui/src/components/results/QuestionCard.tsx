import { Question, TaskStatus } from '@/types/Hypothesis';
import { SqlResults } from './SqlResults';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface QuestionCardProps {
  question: Question;
}

export const QuestionCard = ({ question }: QuestionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isProcessing = question.status === TaskStatus.PROCESSING || question.status === TaskStatus.PENDING;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white shadow-lg overflow-hidden sm:rounded-xl transition-all duration-200 hover:shadow-xl">
      <div className="px-6 py-6">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{question.question_title}</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  question.status === TaskStatus.COMPLETED ? 'bg-green-500' :
                  question.status === TaskStatus.PROCESSING ? 'bg-yellow-500 animate-pulse' :
                  question.status === TaskStatus.PENDING ? 'bg-blue-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium text-gray-600">{question.status}</span>
              </div>
              <span className="text-sm text-gray-500">Updated: {formatDate(question.updated_at)}</span>
            </div>
            {(isProcessing && question.query) && (
              <div className="mt-2 bg-blue-50 p-2 rounded-md">
                <p className="text-sm text-blue-700 font-mono">{question.query}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={isProcessing}
            className={`ml-6 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg
              transition-all duration-200 text-gray-900 ${isProcessing
              ? 'bg-gray-100 cursor-not-allowed opacity-50'
              : 'bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            <span className="mr-2">{isExpanded ? 'Hide Details' : 'Show Details'}</span>
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Answer</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{question.answer}</p>
          </div>
        </div>
      </div>
      <div className={`
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}
      `}>
        <div className="border-t border-gray-200 px-6 py-6">
          <dl className="sm:divide-y sm:divide-gray-200">
            {question.used_tools?.map((tool, toolIndex) => (
              <SqlResults key={toolIndex} tool={tool} toolIndex={toolIndex} />
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

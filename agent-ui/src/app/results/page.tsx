'use client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { HypothesisCard } from '@/components/results/HypothesisCard';
import { QuestionCard } from '@/components/results/QuestionCard';
import { useResults } from '@/hooks/useResults';
import { ErrorCard } from '@/components/results/ErrorCard';
import { Hypothesis, Question, ErrorResult } from '@/types/Hypothesis';

export default function ResultsOverviewPage() {
  const { results, loading } = useResults();

  const renderResult = (result: Hypothesis | Question | ErrorResult) => {
    if ('error' in result) {
      return <ErrorCard key={result._id} error={result as ErrorResult} />;
    }
    if (result.task_type === 'hypothesis') {
      return <HypothesisCard key={result.hypothesis_name} hypothesis={result as Hypothesis} />;
    } else if (result.task_type === 'general_question') {
      return <QuestionCard key={result._id} question={result as Question} />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Results</h1>

        {loading ? (
          <LoadingSpinner />
        ) : results.length > 0 ? (
          <div className="space-y-6">
            {results.map((result) => renderResult(result))}
          </div>
        ) : (
          <p className="text-center text-gray-600">No data available.</p>
        )}
      </div>
    </div>
  );
}

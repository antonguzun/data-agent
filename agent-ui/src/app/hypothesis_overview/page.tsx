'use client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { HypothesisCard } from '@/components/hypothesis/HypothesisCard';
import { useHypotheses } from '@/hooks/useHypotheses';

export default function HypothesisOverviewPage() {
  const { hypotheses, loading } = useHypotheses();

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Hypotheses Overview</h1>

        {loading ? (
          <LoadingSpinner />
        ) : hypotheses.length > 0 ? (
          <div className="space-y-6">
            {hypotheses.map((hypothesis, index) => (
              <HypothesisCard key={index} hypothesis={hypothesis} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">No hypotheses data available.</p>
        )}
      </div>
    </div>
  );
}

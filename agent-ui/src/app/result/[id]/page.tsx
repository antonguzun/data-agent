'use client';
import { useEffect, useState } from 'react';
import { HypothesisCard } from '@/components/results/HypothesisCard';
import { QuestionCard } from '@/components/results/QuestionCard';
import { ErrorCard } from '@/components/results/ErrorCard';
import { Hypothesis, Question, ErrorResult } from '@/types/Hypothesis';
import { message } from 'antd';

export default function ResultPage({ params }: { params: { id: string } }) {
  const [result, setResult] = useState<Hypothesis | Question | ErrorResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/results/${params.id}`);
        const data = await response.json();
        setResult(data);
      } catch (error) {
        console.error('Error fetching result:', error);
        message.error('Failed to load result');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [params.id]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!result) {
    return <div className="flex justify-center items-center min-h-screen">Result not found</div>;
  }

  const renderResult = () => {
    if ('error' in result) {
      return <ErrorCard error={result as ErrorResult} />;
    }
    if (result.task_type === 'hypothesis') {
      return <HypothesisCard hypothesis={result as Hypothesis} />;
    } else if (result.task_type === 'general_question') {
      return <QuestionCard question={result as Question} />;
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {renderResult()}
    </div>
  );
}

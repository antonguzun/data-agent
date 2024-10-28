'use client';
import { useEffect, useState } from 'react';
import { HypothesisCard } from '@/components/hypothesis/HypothesisCard';
import { Hypothesis } from '@/types/Hypothesis';
import { message } from 'antd';

export default function HypothesisPage({ params }: { params: { id: string } }) {
  const [hypothesis, setHypothesis] = useState<Hypothesis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHypothesis = async () => {
      try {
        const response = await fetch(`/api/hypothesis/${params.id}`);
        const data = await response.json();
        setHypothesis(data);
      } catch (error) {
        console.error('Error fetching hypothesis:', error);
        message.error('Failed to load hypothesis');
      } finally {
        setLoading(false);
      }
    };

    fetchHypothesis();
  }, [params.id]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!hypothesis) {
    return <div className="flex justify-center items-center min-h-screen">Hypothesis not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <HypothesisCard hypothesis={hypothesis} />
    </div>
  );
}

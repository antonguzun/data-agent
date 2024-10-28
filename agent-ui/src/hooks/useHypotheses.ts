import { useState, useEffect } from 'react';
import { message } from 'antd';
import { Hypothesis } from '@/types/Hypothesis';

export const useHypotheses = () => {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHypotheses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hypothesis');
      if (!response.ok) {
        throw new Error('Failed to fetch hypothesis');
      }
      const data = await response.json();
      setHypotheses(data);
    } catch (error) {
      console.error('Error loading hypothesis:', error);
      message.error('Failed to load hypothesis');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHypotheses();
  }, []);

  return { hypotheses, loading, loadHypotheses };
};

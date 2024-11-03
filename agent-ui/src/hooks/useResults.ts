import { useState, useEffect } from 'react';
import { message } from 'antd';
import { Hypothesis, Question } from '@/types/Hypothesis';

export const useResults = () => {
  const [results, setResults] = useState<(Hypothesis | Question)[]>([]);
  const [loading, setLoading] = useState(false);

  const loadResults = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/results');
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error loading results:', error);
      message.error('Failed to load results');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadResults();
  }, []);

  return { results, loading, loadResults };
};

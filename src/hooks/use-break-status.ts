"use client";

import { useState, useEffect } from 'react';
import type { Break } from '@/lib/types';

interface BreakStatus {
  activeBreak: Break | null;
  timeRemaining: number;
  isBreakActive: boolean;
  loading: boolean;
}

const now = Date.now();
const mockBreaks: Break[] = [
  {
    id: 'lunch-1',
    name: 'Lunch Break',
    startTime: now - 10 * 60 * 1000, // 10 minutes ago
    endTime: now + 20 * 60 * 1000,   // 20 minutes from now
  },
];

// Mock hook to simulate real-time break status from Firestore
export const useBreakStatus = (): BreakStatus => {
  const [status, setStatus] = useState<BreakStatus>({
    activeBreak: null,
    timeRemaining: 0,
    isBreakActive: false,
    loading: true,
  });

  useEffect(() => {
    const checkBreaks = () => {
      const currentTime = Date.now();
      const currentBreak = mockBreaks.find(b => currentTime >= b.startTime && currentTime < b.endTime) || null;
      
      if (currentBreak) {
        setStatus({
          activeBreak: currentBreak,
          timeRemaining: currentBreak.endTime - currentTime,
          isBreakActive: true,
          loading: false,
        });
      } else {
        setStatus({
          activeBreak: null,
          timeRemaining: 0,
          isBreakActive: false,
          loading: false,
        });
      }
    };

    checkBreaks();
    const interval = setInterval(checkBreaks, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
};

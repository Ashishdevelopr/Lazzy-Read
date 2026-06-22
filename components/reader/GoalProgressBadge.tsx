'use client';

import { useEffect, useState } from 'react';
import type { Progress, ReadingSession } from '@/types';
import { computeGoalStatus, getPagesReadToday } from '@/lib/goals';

interface GoalProgressBadgeProps {
  progress: Progress | null;
  sessions: ReadingSession[];
}

export function GoalProgressBadge({ progress, sessions }: GoalProgressBadgeProps) {
  const [celebrate, setCelebrate] = useState(false);

  const todayPages = getPagesReadToday(sessions);
  const goal = progress?.pagesPerDayGoal ?? 10;
  const pct = Math.min(100, Math.round((todayPages / goal) * 100));
  const status = progress ? computeGoalStatus(progress) : 'not-started';
  const goalMet = goal > 0 && todayPages >= goal;

  useEffect(() => {
    if (goalMet) {
      setCelebrate(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
      const t = setTimeout(() => setCelebrate(false), 1200);
      return () => clearTimeout(t);
    }
  }, [goalMet]);

  const statusColor = {
    'on-track': 'bg-blue-500',
    'ahead': 'bg-green-500',
    'behind': 'bg-red-500',
    'not-started': 'bg-gray-400',
  }[status];

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm ${celebrate ? 'celebrate' : ''}`}>
      <div className="w-16 h-1.5 rounded-full bg-white/30 overflow-hidden">
        <div className={`h-full rounded-full ${statusColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-white font-medium">{todayPages}/{goal}</span>
    </div>
  );
}

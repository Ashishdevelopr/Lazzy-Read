'use client';

interface CalendarHeatmapProps {
  dayMap: Record<string, number>;
}

function getIntensity(pages: number): number {
  if (pages === 0) return 0;
  if (pages < 5) return 1;
  if (pages < 15) return 2;
  if (pages < 30) return 3;
  return 4;
}

const intensityColors = [
  'bg-[var(--border-color)]',
  'bg-green-200',
  'bg-green-400',
  'bg-green-600',
  'bg-green-800',
];

export function CalendarHeatmap({ dayMap }: CalendarHeatmapProps) {
  const weeks: string[][] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 363);

  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  const current = new Date(startDate);
  let week: string[] = [];

  while (current <= today) {
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    week.push(dateStr);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    current.setDate(current.getDate() + 1);
  }
  if (week.length > 0) weeks.push(week);

  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex gap-1" style={{ minWidth: weeks.length * 14 }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((date) => {
              const pages = dayMap[date] || 0;
              const intensity = getIntensity(pages);
              const isFuture = date > `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              return (
                <div key={date} className={`heatmap-cell ${isFuture ? 'opacity-20' : ''} ${intensityColors[intensity]}`} title={`${date}: ${pages} pages`} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

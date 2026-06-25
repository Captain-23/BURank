"use client";

import { useMemo } from "react";

interface HeatmapProps {
  data: Record<string, number>;
}

export default function Heatmap({ data }: HeatmapProps) {
  // Generate the last 365 days
  const { days, maxSubmissions } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today
    const pastYear = new Date(today);
    pastYear.setDate(today.getDate() - 364); // 365 days total

    const daysArray = [];
    let maxSub = 0;

    // Fill the array with the exact dates
    for (let d = new Date(pastYear); d <= today; d.setDate(d.getDate() + 1)) {
      // Find the start of that specific day in unix seconds
      const daySeconds = Math.floor(d.getTime() / 1000);
      
      // Leetcode timestamps might not exactly match 00:00:00 of the local timezone,
      // but usually the calendar groups by the day. We'll find any timestamp that falls in this day.
      // Wait, LeetCode's submissionCalendar contains unix timestamps as keys.
      // We can just iterate over all keys in `data` and assign them to the correct day.
      daysArray.push({
        date: new Date(d),
        count: 0
      });
    }

    // Map the leetcode data to our days
    Object.entries(data).forEach(([timestampStr, count]) => {
      const ts = parseInt(timestampStr, 10) * 1000;
      const date = new Date(ts);
      date.setHours(0, 0, 0, 0); // normalize to day

      // Find the index in our daysArray
      const diffTime = Math.abs(date.getTime() - pastYear.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays < daysArray.length) {
        daysArray[diffDays].count += count;
        if (daysArray[diffDays].count > maxSub) {
          maxSub = daysArray[diffDays].count;
        }
      }
    });

    return { days: daysArray, maxSubmissions: maxSub };
  }, [data]);

  // Color logic
  const getColor = (count: number) => {
    if (count === 0) return "rgba(255,255,255,0.05)";
    if (count === 1) return "rgba(0, 184, 163, 0.4)";
    if (count <= 3) return "rgba(0, 184, 163, 0.6)";
    if (count <= 6) return "rgba(0, 184, 163, 0.8)";
    return "rgba(0, 184, 163, 1)";
  };

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Calculate which month label goes above which column.
  // There are roughly 52 weeks.
  const getMonthLabels = () => {
    const labels: React.ReactNode[] = [];
    let currentMonth = -1;
    
    // Iterate by weeks
    for (let i = 0; i < days.length; i += 7) {
      const day = days[i];
      if (!day) break;
      const month = day.date.getMonth();
      if (month !== currentMonth) {
        labels.push(
          <div key={i} className="absolute text-xs" style={{ left: `${(i / 7) * 14}px`, color: "var(--bu-sub)" }}>
            {monthLabels[month]}
          </div>
        );
        currentMonth = month;
      }
    }
    return labels;
  };

  return (
    <div className="w-full relative flex flex-col pt-6">
      <div className="relative h-4 w-full mb-2">
        {getMonthLabels()}
      </div>
      
      <div className="flex gap-2">
        <div className="flex flex-col justify-between text-xs py-1" style={{ color: "var(--bu-sub)" }}>
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        
        <div 
          className="grid grid-rows-7 gap-1"
          style={{ gridAutoFlow: "column", gridAutoColumns: "10px" }}
        >
          {/* Add empty placeholder blocks for the start if the first day is not Sunday */}
          {Array.from({ length: days[0].date.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: "transparent" }} />
          ))}

          {days.map((day, i) => (
            <div 
              key={i} 
              className="w-2.5 h-2.5 rounded-[2px] transition-colors hover:ring-1 hover:ring-white/50 relative group cursor-pointer"
              style={{ background: getColor(day.count) }}
            >
              {/* Tooltip */}
              <div 
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
              >
                {day.count} submissions on {day.date.toDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-end gap-2 text-xs" style={{ color: "var(--bu-sub)" }}>
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-[2px]" style={{ background: getColor(0) }} />
          <div className="w-2.5 h-2.5 rounded-[2px]" style={{ background: getColor(1) }} />
          <div className="w-2.5 h-2.5 rounded-[2px]" style={{ background: getColor(3) }} />
          <div className="w-2.5 h-2.5 rounded-[2px]" style={{ background: getColor(6) }} />
          <div className="w-2.5 h-2.5 rounded-[2px]" style={{ background: getColor(10) }} />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

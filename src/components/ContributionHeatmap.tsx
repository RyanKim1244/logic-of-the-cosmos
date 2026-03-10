"use client";

import { useMemo } from "react";

interface ContributionHeatmapProps {
  solvedDates: string[]; // ISO date strings of when problems were solved
}

function getColor(count: number): string {
  if (count === 0) return "bg-neutral-100";
  if (count === 1) return "bg-emerald-200";
  if (count === 2) return "bg-emerald-400";
  if (count <= 4) return "bg-emerald-500";
  return "bg-emerald-700";
}

const DAY_LABELS = ["", "월", "", "수", "", "금", ""];
const WEEKS = 26; // ~6 months

export default function ContributionHeatmap({ solvedDates }: ContributionHeatmapProps) {
  const { grid, months, totalSolved, currentStreak, longestStreak } = useMemo(() => {
    // Count solves per date
    const countMap: Record<string, number> = {};
    for (const d of solvedDates) {
      const dateStr = new Date(d).toISOString().split("T")[0];
      countMap[dateStr] = (countMap[dateStr] || 0) + 1;
    }

    // Build grid: WEEKS weeks ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDay = today.getDay(); // 0=Sun

    // Start from WEEKS weeks ago, aligned to Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - (WEEKS * 7) - todayDay);

    const weeks: { date: string; count: number }[][] = [];
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;

    for (let w = 0; w <= WEEKS; w++) {
      const week: { date: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const dateStr = date.toISOString().split("T")[0];
        const isFuture = date > today;
        week.push({ date: dateStr, count: isFuture ? -1 : (countMap[dateStr] || 0) });

        if (d === 0 && date.getMonth() !== lastMonth) {
          lastMonth = date.getMonth();
          monthLabels.push({ label: `${date.getMonth() + 1}월`, col: w });
        }
      }
      weeks.push(week);
    }

    // Calculate streaks
    let current = 0;
    let longest = 0;
    let streak = 0;
    const totalDays: string[] = [];

    for (let i = 0; i <= (WEEKS + 1) * 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      if (date > today) break;
      const dateStr = date.toISOString().split("T")[0];
      if (countMap[dateStr]) {
        streak++;
        longest = Math.max(longest, streak);
      } else {
        streak = 0;
      }
      totalDays.push(dateStr);
    }

    // Current streak (count backwards from today)
    current = 0;
    for (let i = 0; ; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      if (countMap[dateStr]) {
        current++;
      } else {
        break;
      }
    }

    return {
      grid: weeks,
      months: monthLabels,
      totalSolved: solvedDates.length,
      currentStreak: current,
      longestStreak: longest,
    };
  }, [solvedDates]);

  return (
    <div className="border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs text-neutral-400 uppercase tracking-[0.3em]">풀이 활동</h2>
        <span className="text-xs text-neutral-500">
          최근 {WEEKS}주간 <span className="font-medium text-black">{totalSolved}</span>문제 풀이
        </span>
      </div>

      {/* Month labels */}
      <div className="flex mb-1 ml-8">
        {months.map((m, i) => (
          <div
            key={i}
            className="text-[10px] text-neutral-400 absolute"
            style={{ marginLeft: `${m.col * 14}px` }}
          >
            {m.label}
          </div>
        ))}
      </div>

      <div className="flex gap-0.5 mt-5 overflow-x-auto">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1 shrink-0">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="w-6 h-[12px] flex items-center justify-end pr-1">
              <span className="text-[10px] text-neutral-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-[12px] h-[12px] rounded-sm ${
                  day.count === -1 ? "bg-transparent" : getColor(day.count)
                }`}
                title={day.count >= 0 ? `${day.date}: ${day.count}문제` : ""}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <span>연속 <span className="font-medium text-black">{currentStreak}</span>일</span>
          <span>최장 <span className="font-medium text-black">{longestStreak}</span>일</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-neutral-400 mr-1">적음</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-[12px] h-[12px] rounded-sm ${getColor(level === 0 ? 0 : level)}`}
            />
          ))}
          <span className="text-[10px] text-neutral-400 ml-1">많음</span>
        </div>
      </div>
    </div>
  );
}

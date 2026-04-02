"use client";

import { useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface ContributionHeatmapProps {
  solvedDates: string[];
}

function getColor(count: number): string {
  if (count === 0) return "#f5f5f5";
  if (count === 1) return "#a7f3d0";
  if (count === 2) return "#34d399";
  if (count <= 4) return "#10b981";
  return "#047857";
}

const WEEKS = 52;

export default function ContributionHeatmap({ solvedDates }: ContributionHeatmapProps) {
  const { t, locale } = useLanguage();

  const { grid, monthLabels, totalSolved, currentStreak, longestStreak } = useMemo(() => {
    const countMap: Record<string, number> = {};
    for (const d of solvedDates) {
      const date = new Date(d);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      countMap[key] = (countMap[key] || 0) + 1;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDay = today.getDay();

    const start = new Date(today);
    start.setDate(start.getDate() - WEEKS * 7 - todayDay);

    const weeks: { date: string; count: number }[][] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let prevMonth = -1;

    const monthNames = locale === "en"
      ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      : null;

    for (let w = 0; w <= WEEKS; w++) {
      const week: { date: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const isFuture = date > today;
        week.push({ date: key, count: isFuture ? -1 : (countMap[key] || 0) });

        if (d === 0 && date.getMonth() !== prevMonth) {
          prevMonth = date.getMonth();
          const label = monthNames ? monthNames[date.getMonth()] : `${date.getMonth() + 1}월`;
          const lastWeekIndex = months.length > 0 ? months[months.length - 1].weekIndex : -10;
          if (w - lastWeekIndex >= 3) {
            months.push({ label, weekIndex: w });
          }
        }
      }
      weeks.push(week);
    }

    let longest = 0;
    let streak = 0;
    for (let i = 0; i <= (WEEKS + 1) * 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      if (date > today) break;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      if (countMap[key]) {
        streak++;
        longest = Math.max(longest, streak);
      } else {
        streak = 0;
      }
    }

    let current = 0;
    for (let i = 0; ; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      if (countMap[key]) {
        current++;
      } else {
        break;
      }
    }

    return {
      grid: weeks,
      monthLabels: months,
      totalSolved: solvedDates.length,
      currentStreak: current,
      longestStreak: longest,
    };
  }, [solvedDates, locale]);

  const CELL = 11;
  const GAP = 2;
  const COL = CELL + GAP;
  const LEFT_PAD = 28;
  const TOP_PAD = 18;
  const svgWidth = LEFT_PAD + (WEEKS + 1) * COL;
  const svgHeight = TOP_PAD + 7 * COL;

  const dayLabels = [
    { label: t.heatmap.mon, row: 1 },
    { label: t.heatmap.wed, row: 3 },
    { label: t.heatmap.fri, row: 5 },
  ];

  return (
    <div className="border border-neutral-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs text-neutral-400 uppercase tracking-[0.3em]">{t.heatmap.title}</h2>
        <span className="text-xs text-neutral-500">
          {t.heatmap.recentWeeks.replace("{weeks}", String(WEEKS))} <span className="font-medium text-black">{totalSolved}</span> {t.heatmap.solvedSuffix}
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} className="block">
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={LEFT_PAD + m.weekIndex * COL}
              y={12}
              className="fill-neutral-400"
              fontSize="10"
            >
              {m.label}
            </text>
          ))}

          {dayLabels.map((d) => (
            <text
              key={d.row}
              x={0}
              y={TOP_PAD + d.row * COL + CELL - 2}
              className="fill-neutral-400"
              fontSize="10"
            >
              {d.label}
            </text>
          ))}

          {grid.map((week, wi) =>
            week.map((day, di) => {
              if (day.count === -1) return null;
              return (
                <rect
                  key={`${wi}-${di}`}
                  x={LEFT_PAD + wi * COL}
                  y={TOP_PAD + di * COL}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={getColor(day.count)}
                >
                  <title>{day.date}: {day.count} {t.heatmap.problemSuffix}</title>
                </rect>
              );
            })
          )}
        </svg>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <span>{t.heatmap.streak} <span className="font-medium text-black">{currentStreak}</span>{t.heatmap.daySuffix}</span>
          <span>{t.heatmap.longestStreak} <span className="font-medium text-black">{longestStreak}</span>{t.heatmap.daySuffix}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-neutral-400 mr-1">{t.heatmap.less}</span>
          {[0, 1, 2, 3, 5].map((count) => (
            <svg key={count} width={CELL} height={CELL}>
              <rect width={CELL} height={CELL} rx={2} fill={getColor(count)} />
            </svg>
          ))}
          <span className="text-[10px] text-neutral-400 ml-1">{t.heatmap.more}</span>
        </div>
      </div>
    </div>
  );
}

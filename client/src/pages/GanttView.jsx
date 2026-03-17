import { useMemo, useState } from 'react';
import { Calendar, AlertCircle, Clock3, Filter, Layers3 } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_WIDTH = 34;
const TIMELINE_PADDING_START = 2;
const TIMELINE_PADDING_END = 3;
const MIN_TIMELINE_WIDTH = 680;
const FILTERS = ['All', 'In Progress', 'Blocked', 'Done', 'Todo', 'Overdue'];

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value, amount) {
  const date = startOfDay(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function diffDays(later, earlier) {
  return Math.round((startOfDay(later) - startOfDay(earlier)) / DAY_MS);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonthLabel(value) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function getStatusConfig(status) {
  if (status === 'Done') {
    return {
      badge: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
      bar: 'border-emerald-400/30 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600',
      chip: 'bg-emerald-500',
    };
  }

  if (status === 'Blocked') {
    return {
      badge: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border border-rose-500/20',
      bar: 'border-rose-400/30 bg-gradient-to-r from-rose-500 via-red-500 to-orange-500',
      chip: 'bg-rose-500',
    };
  }

  if (status === 'In Progress') {
    return {
      badge: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border border-sky-500/20',
      bar: 'border-sky-400/30 bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500',
      chip: 'bg-sky-500',
    };
  }

  return {
    badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-400/20',
    bar: 'border-slate-400/30 bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600',
    chip: 'bg-slate-400',
  };
}

function getPriorityConfig(priority) {
  if (priority === 'High') return 'text-rose-600 dark:text-rose-300';
  if (priority === 'Low') return 'text-emerald-600 dark:text-emerald-300';
  return 'text-amber-600 dark:text-amber-300';
}

function getProgress(task, status) {
  if (task.subtasks?.length) {
    const completed = task.subtasks.filter((subtask) => subtask.completed).length;
    return completed / task.subtasks.length;
  }

  if (status === 'Done') return 1;
  if (status === 'In Progress') return 0.62;
  if (status === 'Blocked') return 0.28;
  return 0.12;
}

function getTaskEnd(task, start) {
  if (task.dueDate) {
    const due = startOfDay(task.dueDate);
    return due < start ? start : due;
  }

  if (task.completedAt) {
    const completed = startOfDay(task.completedAt);
    return completed < start ? start : completed;
  }

  return addDays(start, 6);
}

function buildTimeline(tasks) {
  const today = startOfDay(new Date());

  if (!tasks.length) {
    const emptyStart = addDays(today, -2);
    const emptyEnd = addDays(today, 10);
    const totalDays = diffDays(emptyEnd, emptyStart) + 1;

    return {
      rows: [],
      dayColumns: Array.from({ length: totalDays }, (_, index) => {
        const date = addDays(emptyStart, index);
        return {
          key: date.toISOString(),
          date,
          day: date.toLocaleDateString('en-US', { day: 'numeric' }),
          weekday: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
          weekend: date.getDay() === 0 || date.getDay() === 6,
          showLabel: index % 2 === 0,
        };
      }),
      monthSegments: [{ key: 'empty', label: formatMonthLabel(emptyStart), width: totalDays * DAY_WIDTH }],
      timelineWidth: Math.max(totalDays * DAY_WIDTH, MIN_TIMELINE_WIDTH),
      todayOffset: 2 * DAY_WIDTH + DAY_WIDTH / 2,
      totalDays,
      timelineStart: emptyStart,
      timelineEnd: emptyEnd,
    };
  }

  const rows = tasks.map((task) => {
    const status = task.effectiveStatus || task.status || 'Todo';
    const priority = task.effectivePriority || task.priority || 'Medium';
    const start = startOfDay(task.createdAt || new Date());
    const end = getTaskEnd(task, start);
    const durationDays = Math.max(1, diffDays(end, start) + 1);
    const progress = clamp(getProgress(task, status), 0, 1);
    const isOverdue = status !== 'Done' && task.dueDate && startOfDay(task.dueDate) < today;
    const isDueSoon = status !== 'Done' && task.dueDate && diffDays(task.dueDate, today) >= 0 && diffDays(task.dueDate, today) <= 3;

    return {
      ...task,
      status,
      priority,
      start,
      end,
      durationDays,
      progress,
      isOverdue,
      isDueSoon,
      dependencyCount: task.dependsOn?.length || 0,
      statusConfig: getStatusConfig(status),
    };
  });

  const earliestStart = rows.reduce((min, row) => (row.start < min ? row.start : min), rows[0].start);
  const latestEnd = rows.reduce((max, row) => (row.end > max ? row.end : max), rows[0].end);
  const timelineStart = addDays(earliestStart, -TIMELINE_PADDING_START);
  const timelineEnd = addDays(latestEnd, TIMELINE_PADDING_END);
  const totalDays = diffDays(timelineEnd, timelineStart) + 1;
  const timelineWidth = Math.max(totalDays * DAY_WIDTH, MIN_TIMELINE_WIDTH);
  const labelFrequency = totalDays <= 28 ? 1 : totalDays <= 56 ? 2 : totalDays <= 84 ? 4 : 7;

  const dayColumns = Array.from({ length: totalDays }, (_, index) => {
    const date = addDays(timelineStart, index);
    return {
      key: date.toISOString(),
      date,
      day: date.toLocaleDateString('en-US', { day: 'numeric' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
      weekend: date.getDay() === 0 || date.getDay() === 6,
      showLabel: index % labelFrequency === 0 || date.getDate() === 1,
    };
  });

  const monthSegments = [];
  let cursor = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1);
  while (cursor <= timelineEnd) {
    const segmentStart = startOfDay(cursor < timelineStart ? timelineStart : cursor);
    const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const rawSegmentEnd = addDays(nextMonth, -1);
    const segmentEnd = rawSegmentEnd > timelineEnd ? timelineEnd : rawSegmentEnd;
    const width = (diffDays(segmentEnd, segmentStart) + 1) * DAY_WIDTH;

    monthSegments.push({
      key: cursor.toISOString(),
      label: formatMonthLabel(segmentStart),
      width,
    });

    cursor = nextMonth;
  }

  const decoratedRows = rows
    .sort((a, b) => a.end - b.end || a.start - b.start)
    .map((row) => {
      const left = diffDays(row.start, timelineStart) * DAY_WIDTH;
      const width = Math.max(row.durationDays * DAY_WIDTH, 44);
      const endOffset = diffDays(row.end, timelineStart) * DAY_WIDTH + DAY_WIDTH / 2;

      return {
        ...row,
        left,
        width,
        endOffset,
      };
    });

  const todayOffset = diffDays(today, timelineStart) >= 0 && diffDays(today, timelineStart) < totalDays
    ? diffDays(today, timelineStart) * DAY_WIDTH + DAY_WIDTH / 2
    : null;

  return {
    rows: decoratedRows,
    dayColumns,
    monthSegments,
    timelineWidth,
    todayOffset,
    totalDays,
    timelineStart,
    timelineEnd,
  };
}

export default function GanttView() {
  const { tasks, loading } = useTasks();
  const [filter, setFilter] = useState('All');

  const visibleTasks = useMemo(() => {
    const today = startOfDay(new Date());

    return tasks.filter((task) => {
      const status = task.effectiveStatus || task.status || 'Todo';

      if (filter === 'All') return true;
      if (filter === 'Overdue') {
        return status !== 'Done' && task.dueDate && startOfDay(task.dueDate) < today;
      }

      return status === filter;
    });
  }, [tasks, filter]);

  const timeline = useMemo(() => buildTimeline(visibleTasks), [visibleTasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => (task.effectiveStatus || task.status) === 'Done').length;
  const blockedTasks = tasks.filter((task) => (task.effectiveStatus || task.status) === 'Blocked').length;
  const activeTasks = tasks.filter((task) => (task.effectiveStatus || task.status) === 'In Progress').length;
  const timelineRangeLabel = timeline.timelineStart && timeline.timelineEnd
    ? `${formatShortDate(timeline.timelineStart)} - ${formatShortDate(timeline.timelineEnd)}`
    : 'No scheduled range';

  return (
    <div className="p-4 pt-16 md:pt-8 md:p-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/85 px-6 py-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/75 md:px-8 md:py-8">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/15" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/10" />
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600 dark:text-sky-300">Project Rhythm</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-4xl">Gantt Timeline</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              A cleaner schedule view focused on timing, task state, and what needs attention next.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total</p>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{totalTasks}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">In Progress</p>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{activeTasks}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Blocked</p>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{blockedTasks}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed</p>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{completedTasks}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-slate-200/70 bg-white/85 p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/75 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              <Filter size={14} />
              Focus
            </div>
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  filter === option
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15 dark:bg-white dark:text-slate-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-900">
              <Layers3 size={14} />
              {visibleTasks.length} visible task{visibleTasks.length !== 1 ? 's' : ''}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-900">
              <Clock3 size={14} />
              {timelineRangeLabel}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            In Progress
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            Blocked
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Done
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            Todo
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-7 w-px bg-amber-400/90 shadow-[0_0_24px_rgba(251,191,36,0.45)]" />
            Today marker
          </div>
        </div>

        {loading ? (
          <div className="mt-6 flex h-[480px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
            <div className="text-center">
              <p className="text-base font-semibold">Loading timeline</p>
              <p className="mt-2 text-sm">Preparing the project schedule view...</p>
            </div>
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="mt-6 flex min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-6 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <Calendar size={44} className="text-slate-400" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Nothing matches this timeline view</h2>
            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Try another filter or create tasks with dates to bring the schedule to life.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200/80 bg-slate-50/70 shadow-inner dark:border-slate-800/80 dark:bg-slate-950/70">
            <div className="overflow-x-auto">
              <div
                className="grid min-w-max"
                style={{ gridTemplateColumns: `232px ${timeline.timelineWidth}px` }}
              >
                <div className="sticky left-0 z-20 border-b border-r border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/95">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Tasks</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">Task and due date</p>
                </div>

                <div className="relative border-b border-slate-200/80 bg-white/90 dark:border-slate-800/80 dark:bg-slate-950/90">
                  <div className="flex border-b border-slate-200/70 dark:border-slate-800/70">
                    {timeline.monthSegments.map((segment) => (
                      <div
                        key={segment.key}
                        className="border-r border-slate-200/60 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-800/60 dark:text-slate-200"
                        style={{ width: `${segment.width}px` }}
                      >
                        {segment.label}
                      </div>
                    ))}
                  </div>

                  <div
                    className="grid"
                    style={{ gridTemplateColumns: `repeat(${timeline.dayColumns.length}, ${DAY_WIDTH}px)` }}
                  >
                    {timeline.dayColumns.map((column) => (
                      <div
                        key={column.key}
                        className={`border-r border-slate-200/50 px-1 py-1.5 text-center dark:border-slate-800/60 ${
                          column.weekend ? 'bg-slate-100/70 dark:bg-slate-900/80' : ''
                        }`}
                      >
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                          {column.showLabel ? column.weekday : ''}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {column.showLabel ? column.day : ''}
                        </p>
                      </div>
                    ))}
                  </div>

                  {timeline.todayOffset !== null && (
                    <div
                      className="pointer-events-none absolute bottom-0 top-0 z-10"
                      style={{ left: `${timeline.todayOffset}px` }}
                    >
                      <div className="relative h-full w-px bg-amber-400/95 shadow-[0_0_28px_rgba(251,191,36,0.55)]">
                        <span className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-amber-400 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-950">
                          Today
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {timeline.rows.map((row) => (
                  <FragmentRow
                    key={row._id}
                    row={row}
                    dayColumns={timeline.dayColumns}
                    todayOffset={timeline.todayOffset}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function FragmentRow({ row, dayColumns, todayOffset }) {
  const compactBar = row.width < 130;
  const barWidth = Math.max(row.width - 10, 36);
  const progressWidth = row.progress === 1 ? '100%' : `${Math.max(row.progress * 100, compactBar ? 20 : 16)}%`;
  const durationText = `${row.durationDays} day${row.durationDays === 1 ? '' : 's'}`;

  return (
    <>
      <div className="sticky left-0 z-10 border-r border-t border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur transition-colors hover:bg-white dark:border-slate-800/80 dark:bg-slate-950/95 dark:hover:bg-slate-950">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{row.title}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.statusConfig.badge}`}>
                {row.status}
              </span>
              <span className={`text-xs font-semibold ${getPriorityConfig(row.priority)}`}>
                {row.priority}
              </span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Due</p>
            <p className={`mt-1 text-sm font-semibold ${row.isOverdue ? 'text-rose-600 dark:text-rose-300' : 'text-slate-800 dark:text-slate-100'}`}>
              {formatShortDate(row.end)}
            </p>
          </div>
        </div>

        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          {formatShortDate(row.start)} - {formatShortDate(row.end)}
        </div>
      </div>

      <div className="relative border-t border-slate-200/70 bg-white/70 dark:border-slate-800/80 dark:bg-slate-950/60">
        <div
          className="grid h-[72px]"
          style={{ gridTemplateColumns: `repeat(${dayColumns.length}, ${DAY_WIDTH}px)` }}
        >
          {dayColumns.map((column) => (
            <div
              key={`${row._id}-${column.key}`}
              className={`border-r border-slate-200/45 dark:border-slate-800/60 ${
                column.weekend ? 'bg-slate-100/70 dark:bg-slate-900/80' : ''
              }`}
            />
          ))}
        </div>

        {todayOffset !== null && (
          <div
            className="pointer-events-none absolute bottom-0 top-0 z-[1] w-px bg-amber-400/80"
            style={{ left: `${todayOffset}px` }}
          />
        )}

        <div
          className={`absolute top-1/2 z-[2] h-9 -translate-y-1/2 rounded-[16px] border shadow-[0_18px_42px_-20px_rgba(15,23,42,0.9)] ${row.statusConfig.bar}`}
          style={{ left: `${row.left + 5}px`, width: `${barWidth}px` }}
        >
          <div
            className="absolute inset-y-[3px] left-[3px] rounded-[14px] bg-white/18"
            style={{ width: progressWidth }}
          />
          <div className="relative flex h-full items-center justify-end gap-2 px-3 text-white">
            {!compactBar && (
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/85">
                {durationText}
              </span>
            )}
          </div>
        </div>

        <div
          className={`absolute top-1/2 z-[3] h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white shadow-md ${
            row.isOverdue ? 'bg-rose-500 shadow-rose-500/35' : row.isDueSoon ? 'bg-amber-400 shadow-amber-400/35' : 'bg-white/90'
          }`}
          style={{ left: `${row.endOffset - 7}px` }}
        />

        {(row.isOverdue || row.isDueSoon) && (
          <div className="absolute bottom-2 right-2 z-[2] inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm dark:bg-slate-900/90 dark:text-slate-200">
            <AlertCircle size={11} className={row.isOverdue ? 'text-rose-500' : 'text-amber-500'} />
            {row.isOverdue ? 'Late' : 'Soon'}
          </div>
        )}
      </div>
    </>
  );
}

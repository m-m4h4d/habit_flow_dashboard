import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Flame,
  Trophy,
  Plus,
  Check,
  Edit3,
  Trash2,
  Calendar,
  BarChart3,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  RotateCcw,
  Copy,
  Award,
  Target,
  Zap,
  Heart,
  BookOpen,
  Dumbbell,
  Coffee,
  Moon,
  Sun,
  X,
  Info,
  ArrowUpRight
} from 'lucide-react';

// --- HELPER UTILITIES FOR DATES & STREAKS ---

// Format a Date object as YYYY-MM-DD in local time
const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get the Monday of the week for a given date
const getStartOfWeek = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  // Convert Sunday (0) to 7 so Monday is 1
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// Add days to a date
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// Categories & Color Palette Configuration
const CATEGORIES = [
  { id: 'all', label: 'All Habits', color: 'indigo' },
  { id: 'health', label: 'Health & Body', color: 'emerald' },
  { id: 'focus', label: 'Deep Work', color: 'violet' },
  { id: 'mindfulness', label: 'Mindfulness', color: 'amber' },
  { id: 'learning', label: 'Growth', color: 'sky' },
];

const COLOR_THEMES = {
  emerald: {
    name: 'Emerald',
    bg: 'bg-emerald-500',
    bgSoft: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    textLight: 'text-emerald-600',
    ring: 'ring-emerald-500/40',
    hex: '#10b981',
    hexSoft: 'rgba(16, 185, 129, 0.2)'
  },
  violet: {
    name: 'Violet',
    bg: 'bg-violet-500',
    bgSoft: 'bg-violet-500/15',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    textLight: 'text-violet-600',
    ring: 'ring-violet-500/40',
    hex: '#8b5cf6',
    hexSoft: 'rgba(139, 92, 246, 0.2)'
  },
  amber: {
    name: 'Amber',
    bg: 'bg-amber-500',
    bgSoft: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    textLight: 'text-amber-600',
    ring: 'ring-amber-500/40',
    hex: '#f59e0b',
    hexSoft: 'rgba(245, 158, 11, 0.2)'
  },
  sky: {
    name: 'Sky',
    bg: 'bg-sky-500',
    bgSoft: 'bg-sky-500/15',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
    textLight: 'text-sky-600',
    ring: 'ring-sky-500/40',
    hex: '#0ea5e9',
    hexSoft: 'rgba(14, 165, 233, 0.2)'
  },
  rose: {
    name: 'Rose',
    bg: 'bg-rose-500',
    bgSoft: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    textLight: 'text-rose-600',
    ring: 'ring-rose-500/40',
    hex: '#f43f5e',
    hexSoft: 'rgba(244, 63, 94, 0.2)'
  }
};

const ICON_OPTIONS = [
  { id: 'dumbbell', label: 'Fitness', Icon: Dumbbell },
  { id: 'book', label: 'Reading', Icon: BookOpen },
  { id: 'zap', label: 'Deep Focus', Icon: Zap },
  { id: 'heart', label: 'Wellness', Icon: Heart },
  { id: 'coffee', label: 'Hydration / Diet', Icon: Coffee },
  { id: 'moon', label: 'Sleep / Rest', Icon: Moon },
  { id: 'target', label: 'Goal', Icon: Target },
  { id: 'sparkles', label: 'Mindfulness', Icon: Sparkles },
];

// Subtle Web Audio API synthesizer for satisfying habit check-off sounds
const playCheckSound = (isChecked, soundEnabled) => {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (isChecked) {
      // Pleasant ascending two-tone chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.24);
    } else {
      // Soft descending pop
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (e) {
    // Ignore audio errors if blocked by browser autoplay policy
  }
};

// Generate initial rich habit dataset anchored around today's date
const createInitialHabits = (todayDate) => {
  const startOfThisWeek = getStartOfWeek(todayDate);

  // Helper to create completion map from relative day offsets from startOfThisWeek
  const buildLogs = (offsets) => {
    const logs = {};
    offsets.forEach((offset) => {
      const d = addDays(startOfThisWeek, offset);
      logs[formatDateKey(d)] = true;
    });
    return logs;
  };

  return [
    {
      id: 'habit-1',
      name: 'Morning Hydration (500ml)',
      description: 'Drink water with electrolytes right after waking up',
      category: 'health',
      color: 'emerald',
      icon: 'coffee',
      weeklyTarget: 7,
      // Completed steadily over the past two weeks + Mon-Fri this week
      logs: buildLogs([-14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4]),
    },
    {
      id: 'habit-2',
      name: 'Deep Work Sprint (90m)',
      description: 'Zero-distraction coding or design block before noon',
      category: 'focus',
      color: 'violet',
      icon: 'zap',
      weeklyTarget: 5,
      logs: buildLogs([-12, -11, -10, -9, -8, -7, -5, -4, -3, -2, -1, 0, 1, 2, 3]),
    },
    {
      id: 'habit-3',
      name: 'Strength & Mobility Training',
      description: '45 mins resistance workout or full-body mobility flow',
      category: 'health',
      color: 'rose',
      icon: 'dumbbell',
      weeklyTarget: 4,
      logs: buildLogs([-14, -12, -10, -8, -6, -5, -3, -2, 0, 1, 3, 4]),
    },
    {
      id: 'habit-4',
      name: 'Read 20 Pages Non-Fiction',
      description: 'Evening reading habit with zero screens in bed',
      category: 'learning',
      color: 'sky',
      icon: 'book',
      weeklyTarget: 6,
      logs: buildLogs([-11, -10, -9, -8, -7, -6, -4, -3, -2, -1, 0, 1, 2, 4]),
    },
    {
      id: 'habit-5',
      name: 'Mindful Breathwork & Journal',
      description: '10 minutes of box breathing and 3 gratitude bullet points',
      category: 'mindfulness',
      color: 'amber',
      icon: 'sparkles',
      weeklyTarget: 5,
      logs: buildLogs([-10, -9, -8, -5, -4, -3, -2, -1, 0, 2, 3, 4]),
    }
  ];
};

// Calculate current streak and best streak for a habit given its logs map
const calculateHabitStreaks = (logs, todayKey, currentWeekEndKey) => {
  const completedDates = Object.keys(logs)
    .filter((k) => logs[k])
    .sort();

  if (completedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0, totalCompleted: 0 };
  }

  // Calculate Best Streak across all logged dates
  let bestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < completedDates.length; i++) {
    const prev = new Date(completedDates[i - 1] + 'T00:00:00');
    const curr = new Date(completedDates[i] + 'T00:00:00');
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak += 1;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else if (diffDays > 1) {
      tempStreak = 1;
    }
  }

  // Calculate Current Active Streak:
  // If user logged future days in the currently viewed week (e.g., testing Sat/Sun),
  // start checking from the latest logged day in the active week, otherwise from today or yesterday.
  let anchorDate = new Date(todayKey + 'T00:00:00');
  const latestLoggedStr = completedDates[completedDates.length - 1];
  if (latestLoggedStr > todayKey && latestLoggedStr <= currentWeekEndKey) {
    anchorDate = new Date(latestLoggedStr + 'T00:00:00');
  }

  let currentStreak = 0;
  let checkDate = new Date(anchorDate);

  // If anchor date isn't completed yet, check if yesterday was completed to keep the streak alive
  if (!logs[formatDateKey(checkDate)]) {
    checkDate = addDays(checkDate, -1);
  }

  while (logs[formatDateKey(checkDate)]) {
    currentStreak += 1;
    checkDate = addDays(checkDate, -1);
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    totalCompleted: completedDates.length
  };
};

export default function HabitTrackerDashboard() {
  // Anchor "today" to the user's actual date
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);

  // State: dark mode, sound, active week offset (0 = current week, -1 = last week, etc.)
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChartTab, setActiveChartTab] = useState('daily'); // 'daily' | 'streaks' | 'heatmap'

  // Habits State (persisted to localStorage with safe fallback)
  const [habits, setHabits] = useState(() => {
    try {
      const saved = localStorage.getItem('habitflow_dashboard_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore storage errors
    }
    return createInitialHabits(new Date());
  });

  useEffect(() => {
    try {
      localStorage.setItem('habitflow_dashboard_v1', JSON.stringify(habits));
    } catch (e) {
      // ignore storage errors
    }
  }, [habits]);

  // Modal States (Add / Edit Habit, Delete Confirmation, Toast Notification)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [hoveredDayIndex, setHoveredDayIndex] = useState(null);

  // Form state inside Add/Edit Modal
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('health');
  const [formColor, setFormColor] = useState('emerald');
  const [formIcon, setFormIcon] = useState('zap');
  const [formTarget, setFormTarget] = useState(5);
  const [formError, setFormError] = useState('');

  // Show temporary toast banner
  const triggerToast = (msg) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Compute the 7 days (Mon - Sun) for the currently selected week
  const activeWeekStart = useMemo(() => {
    const baseMonday = getStartOfWeek(today);
    return addDays(baseMonday, weekOffset * 7);
  }, [today, weekOffset]);

  const weekDays = useMemo(() => {
    const dayNamesShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayNamesFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(activeWeekStart, i);
      const key = formatDateKey(date);
      return {
        index: i,
        date,
        key,
        shortName: dayNamesShort[i],
        fullName: dayNamesFull[i],
        dayNumber: date.getDate(),
        monthShort: date.toLocaleString('default', { month: 'short' }),
        isToday: key === todayKey,
        isFuture: key > todayKey
      };
    });
  }, [activeWeekStart, todayKey]);

  const currentWeekEndKey = weekDays[6].key;

  // Enrich habits with computed streaks and current-week stats
  const enrichedHabits = useMemo(() => {
    return habits.map((habit) => {
      const { currentStreak, bestStreak, totalCompleted } = calculateHabitStreaks(
        habit.logs || {},
        todayKey,
        currentWeekEndKey
      );
      const weekCompletions = weekDays.reduce(
        (acc, day) => acc + (habit.logs?.[day.key] ? 1 : 0),
        0
      );
      const target = habit.weeklyTarget || 7;
      const weekProgressPct = Math.min(100, Math.round((weekCompletions / target) * 100));
      const isGoalMet = weekCompletions >= target;

      return {
        ...habit,
        currentStreak,
        bestStreak,
        totalCompleted,
        weekCompletions,
        weekProgressPct,
        isGoalMet
      };
    });
  }, [habits, todayKey, currentWeekEndKey, weekDays]);

  // Filtered habits for display
  const filteredHabits = useMemo(() => {
    return enrichedHabits.filter((h) => {
      const matchesCat = selectedCategory === 'all' || h.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [enrichedHabits, selectedCategory, searchQuery]);

  // Overall Dashboard Analytics & Weekly Chart Data
  const analytics = useMemo(() => {
    const totalHabitsCount = enrichedHabits.length;
    if (totalHabitsCount === 0) {
      return {
        todayCompleted: 0,
        todayTotal: 0,
        todayPct: 0,
        weeklyCompletedTotal: 0,
        weeklyTargetTotal: 0,
        weeklyCompletionRate: 0,
        longestActiveStreak: 0,
        allTimeBestStreak: 0,
        bestStreakHabitName: 'None',
        goalsHitCount: 0,
        dailyStats: weekDays.map((d) => ({ ...d, completed: 0, total: 0, pct: 0, cumulativeStreakScore: 0 }))
      };
    }

    const todayCompleted = enrichedHabits.filter((h) => h.logs?.[todayKey]).length;
    const todayPct = Math.round((todayCompleted / totalHabitsCount) * 100);

    const weeklyCompletedTotal = enrichedHabits.reduce((sum, h) => sum + h.weekCompletions, 0);
    const weeklyTargetTotal = enrichedHabits.reduce((sum, h) => sum + (h.weeklyTarget || 7), 0);
    const weeklyCompletionRate = weeklyTargetTotal > 0
      ? Math.min(100, Math.round((weeklyCompletedTotal / weeklyTargetTotal) * 100))
      : 0;

    let longestActiveStreak = 0;
    let allTimeBestStreak = 0;
    let bestStreakHabitName = enrichedHabits[0]?.name || '';

    enrichedHabits.forEach((h) => {
      if (h.currentStreak > longestActiveStreak) {
        longestActiveStreak = h.currentStreak;
      }
      if (h.bestStreak > allTimeBestStreak) {
        allTimeBestStreak = h.bestStreak;
        bestStreakHabitName = h.name;
      }
    });

    const goalsHitCount = enrichedHabits.filter((h) => h.isGoalMet).length;

    // Daily stats across the 7 days of the active week
    let runningMomentum = 0;
    const dailyStats = weekDays.map((day) => {
      const completed = enrichedHabits.filter((h) => h.logs?.[day.key]).length;
      const pct = Math.round((completed / totalHabitsCount) * 100);
      // Calculate active streak momentum on each day of the week
      const dayStreakSum = enrichedHabits.reduce((sum, h) => {
        // Count consecutive days up to this specific day.key
        let count = 0;
        let check = new Date(day.key + 'T00:00:00');
        while (h.logs?.[formatDateKey(check)] && count < 30) {
          count++;
          check = addDays(check, -1);
        }
        return sum + count;
      }, 0);

      runningMomentum = dayStreakSum;
      return {
        ...day,
        completed,
        total: totalHabitsCount,
        pct,
        totalStreakMomentum: runningMomentum,
        avgStreakLength: Number((dayStreakSum / totalHabitsCount).toFixed(1))
      };
    });

    return {
      todayCompleted,
      todayTotal: totalHabitsCount,
      todayPct,
      weeklyCompletedTotal,
      weeklyTargetTotal,
      weeklyCompletionRate,
      longestActiveStreak,
      allTimeBestStreak,
      bestStreakHabitName,
      goalsHitCount,
      dailyStats
    };
  }, [enrichedHabits, todayKey, weekDays]);

  // 28-Day Consistency Heatmap Data (Last 4 Weeks ending on activeWeekEnd)
  const heatmapDays = useMemo(() => {
    const start28 = addDays(activeWeekStart, -21); // 3 weeks prior + current week = 28 days
    return Array.from({ length: 28 }, (_, i) => {
      const d = addDays(start28, i);
      const key = formatDateKey(d);
      const count = enrichedHabits.filter((h) => h.logs?.[key]).length;
      const ratio = enrichedHabits.length > 0 ? count / enrichedHabits.length : 0;
      return {
        date: d,
        key,
        count,
        ratio,
        label: d.toLocaleDateString('default', { month: 'short', day: 'numeric' })
      };
    });
  }, [activeWeekStart, enrichedHabits]);

  // Toggle completion of a habit on a specific dateKey
  const handleToggleDay = (habitId, dateKey) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const currentVal = !!h.logs?.[dateKey];
        const nextVal = !currentVal;
        playCheckSound(nextVal, soundEnabled);

        const updatedLogs = { ...(h.logs || {}) };
        if (nextVal) {
          updatedLogs[dateKey] = true;
        } else {
          delete updatedLogs[dateKey];
        }
        return { ...h, logs: updatedLogs };
      })
    );
  };

  // Mark all habits completed for today
  const handleCompleteAllToday = () => {
    playCheckSound(true, soundEnabled);
    setHabits((prev) =>
      prev.map((h) => ({
        ...h,
        logs: { ...(h.logs || {}), [todayKey]: true }
      }))
    );
    triggerToast("All of today's habits marked complete! Keep the streak alive!");
  };

  // Open Modal for Creating a New Habit
  const openAddModal = () => {
    setEditingHabit(null);
    setFormName('');
    setFormDesc('');
    setFormCategory('health');
    setFormColor('emerald');
    setFormIcon('zap');
    setFormTarget(5);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal for Editing an Existing Habit
  const openEditModal = (habit) => {
    setEditingHabit(habit);
    setFormName(habit.name);
    setFormDesc(habit.description || '');
    setFormCategory(habit.category || 'health');
    setFormColor(habit.color || 'emerald');
    setFormIcon(habit.icon || 'zap');
    setFormTarget(habit.weeklyTarget || 5);
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Habit (Create or Edit)
  const handleSaveHabit = (e) => {
    e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed) {
      setFormError('Please enter a habit name.');
      return;
    }

    if (editingHabit) {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === editingHabit.id
            ? {
                ...h,
                name: trimmed,
                description: formDesc.trim(),
                category: formCategory,
                color: formColor,
                icon: formIcon,
                weeklyTarget: Number(formTarget)
              }
            : h
        )
      );
      triggerToast(`Updated "${trimmed}"`);
    } else {
      const newHabit = {
        id: `habit-${Date.now()}`,
        name: trimmed,
        description: formDesc.trim() || 'Daily consistency goal',
        category: formCategory,
        color: formColor,
        icon: formIcon,
        weeklyTarget: Number(formTarget),
        logs: { [todayKey]: true } // Start with today checked off for immediate momentum!
      };
      setHabits((prev) => [newHabit, ...prev]);
      playCheckSound(true, soundEnabled);
      triggerToast(`Added new habit "${trimmed}"`);
    }
    setIsModalOpen(false);
  };

  // Confirm Deletion of a Habit
  const confirmDeleteHabit = () => {
    if (!habitToDelete) return;
    const deletedName = habitToDelete.name;
    setHabits((prev) => prev.filter((h) => h.id !== habitToDelete.id));
    setHabitToDelete(null);
    triggerToast(`Removed "${deletedName}"`);
  };

  // Reset to sample demo data
  const handleResetDemoData = () => {
    const fresh = createInitialHabits(today);
    setHabits(fresh);
    setWeekOffset(0);
    triggerToast('Restored sample habits and streak history');
  };

  // Copy Weekly Progress Report to Clipboard
  const handleCopyWeeklyReport = () => {
    const lines = [
      `📊 HabitFlow Weekly Summary (${weekDays[0].monthShort} ${weekDays[0].dayNumber} - ${weekDays[6].monthShort} ${weekDays[6].dayNumber})`,
      `• Weekly Target Score: ${analytics.weeklyCompletionRate}% (${analytics.weeklyCompletedTotal}/${analytics.weeklyTargetTotal} check-ins)`,
      `• Longest Active Streak: ${analytics.longestActiveStreak} days`,
      `• Weekly Goals Met: ${analytics.goalsHitCount}/${enrichedHabits.length} habits`,
      '',
      'Habit Breakdown:',
      ...enrichedHabits.map(
        (h) =>
          `- ${h.name}: ${h.weekCompletions}/${h.weeklyTarget} days this week | 🔥 ${h.currentStreak}d streak (Best: ${h.bestStreak}d)`
      )
    ];

    const textArea = document.createElement('textarea');
    textArea.value = lines.join('\n');
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      triggerToast('Weekly streak summary copied to clipboard!');
    } catch (err) {
      triggerToast('Could not copy report');
    }
    document.body.removeChild(textArea);
  };

  // Render Icon component by ID
  const renderHabitIcon = (iconId, className = 'w-5 h-5') => {
    const found = ICON_OPTIONS.find((item) => item.id === iconId);
    const IconComp = found ? found.Icon : Zap;
    return <IconComp className={className} />;
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans selection:bg-indigo-500 selection:text-white ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Subtle Ambient Top Glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-gradient-to-b from-indigo-500/10 via-violet-500/5 to-transparent z-0" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/30 animate-bounce">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-indigo-200 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* TOP HEADER */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800/60 dark:border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Flame className="w-6 h-6 text-white fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  HabitFlow
                </h1>
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  Streak Studio
                </span>
              </div>
              <p className={`text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Log daily rituals, build compounding momentum, and visualize weekly streaks
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              className={`p-2.5 rounded-xl border transition ${
                darkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle theme"
              className={`p-2.5 rounded-xl border transition ${
                darkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              onClick={handleCopyWeeklyReport}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition ${
                darkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Copy className="w-4 h-4 text-indigo-400" />
              <span>Export Summary</span>
            </button>

            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Habit</span>
            </button>
          </div>
        </header>

        {/* KPI SUMMARY ROW (4 CARDS) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          {/* Card 1: Today's Completion */}
          <div
            className={`p-5 rounded-2xl border transition relative overflow-hidden ${
              darkMode
                ? 'bg-slate-900/90 border-slate-800/90'
                : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Today's Focus
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-3xl font-bold tracking-tight tabular-nums">
                    {analytics.todayCompleted}/{analytics.todayTotal}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                    {analytics.todayPct}%
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            {/* Progress Bar */}
            <div className={`w-full h-2 rounded-full mt-4 overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${analytics.todayPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2.5 text-xs">
              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                {analytics.todayPct === 100 ? 'All daily goals crushed!' : 'Check off habits below'}
              </span>
              {analytics.todayPct < 100 && analytics.todayTotal > 0 && (
                <button
                  onClick={handleCompleteAllToday}
                  className="text-indigo-400 hover:text-indigo-300 font-medium underline-offset-2 hover:underline"
                >
                  Complete all
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Longest Active Streak */}
          <div
            className={`p-5 rounded-2xl border transition relative overflow-hidden ${
              darkMode
                ? 'bg-slate-900/90 border-slate-800/90'
                : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Active Streak Leader
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-3xl font-bold tracking-tight tabular-nums">
                    {analytics.longestActiveStreak}
                  </span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                    days in a row
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
                <Flame className="w-5 h-5 fill-amber-400/20" />
              </div>
            </div>
            <p className={`text-xs mt-4 truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              All-time record:{' '}
              <strong className={darkMode ? 'text-slate-200' : 'text-slate-800'}>
                {analytics.allTimeBestStreak} days
              </strong>{' '}
              ({analytics.bestStreakHabitName})
            </p>
          </div>

          {/* Card 3: Weekly Target Completion */}
          <div
            className={`p-5 rounded-2xl border transition relative overflow-hidden ${
              darkMode
                ? 'bg-slate-900/90 border-slate-800/90'
                : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Weekly Score
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-3xl font-bold tracking-tight tabular-nums">
                    {analytics.weeklyCompletionRate}%
                  </span>
                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    ({analytics.weeklyCompletedTotal}/{analytics.weeklyTargetTotal} logs)
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className={`w-full h-2 rounded-full mt-4 overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${analytics.weeklyCompletionRate}%` }}
              />
            </div>
            <p className={`text-xs mt-2.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Based on your custom weekly target days
            </p>
          </div>

          {/* Card 4: Weekly Habit Goals Met */}
          <div
            className={`p-5 rounded-2xl border transition relative overflow-hidden ${
              darkMode
                ? 'bg-slate-900/90 border-slate-800/90'
                : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Weekly Targets Hit
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-3xl font-bold tracking-tight tabular-nums">
                    {analytics.goalsHitCount}/{enrichedHabits.length}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
                    Habits
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-400">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <p className={`text-xs mt-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {analytics.goalsHitCount === enrichedHabits.length && enrichedHabits.length > 0
                ? '🏆 Every weekly target achieved!'
                : `${enrichedHabits.length - analytics.goalsHitCount} more habit target(s) to hit this week`}
            </p>
          </div>
        </section>

        {/* INTERACTIVE WEEKLY LOGGING MATRIX + WEEK NAVIGATOR */}
        <section
          className={`rounded-3xl border overflow-hidden mb-8 transition ${
            darkMode
              ? 'bg-slate-900/90 border-slate-800/90 shadow-2xl shadow-black/30'
              : 'bg-white border-slate-200/90 shadow-md'
          }`}
        >
          {/* Matrix Header Controls */}
          <div className="p-5 sm:p-6 border-b border-slate-800/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                        : darkMode
                        ? 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Right: Search & Week Navigator */}
            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
              {/* Search Box */}
              <div className="relative flex-1 sm:flex-initial sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter habits..."
                  className={`w-full pl-9 pr-7 py-1.5 rounded-xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition ${
                    darkMode
                      ? 'bg-slate-950/80 border-slate-800 text-slate-100 placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Week Switcher */}
              <div
                className={`inline-flex items-center gap-1 p-1 rounded-xl border ${
                  darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <button
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className={`p-1.5 rounded-lg transition ${
                    darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-white text-slate-700'
                  }`}
                  title="Previous Week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-2.5 text-xs font-semibold tabular-nums flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {weekDays[0].monthShort} {weekDays[0].dayNumber} – {weekDays[6].monthShort}{' '}
                    {weekDays[6].dayNumber}
                  </span>
                  {weekOffset !== 0 && (
                    <button
                      onClick={() => setWeekOffset(0)}
                      className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
                    >
                      Today
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className={`p-1.5 rounded-lg transition ${
                    darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-white text-slate-700'
                  }`}
                  title="Next Week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Habit Check-in Grid Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[820px]">
              <thead>
                <tr
                  className={`border-b text-left text-xs uppercase tracking-wider ${
                    darkMode
                      ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                      : 'bg-slate-50/80 border-slate-200/80 text-slate-500'
                  }`}
                >
                  <th className="py-3.5 pl-6 pr-4 font-semibold w-[300px]">Habit & Weekly Goal</th>
                  {weekDays.map((day) => (
                    <th key={day.key} className="py-3 px-2 text-center font-semibold w-16">
                      <div
                        className={`inline-flex flex-col items-center px-2.5 py-1 rounded-xl transition ${
                          day.isToday
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                            : ''
                        }`}
                      >
                        <span className="text-[11px] font-semibold">{day.shortName}</span>
                        <span
                          className={`text-sm font-bold mt-0.5 tabular-nums ${
                            day.isToday
                              ? 'text-indigo-400'
                              : darkMode
                              ? 'text-slate-200'
                              : 'text-slate-700'
                          }`}
                        >
                          {day.dayNumber}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-center font-semibold w-36">Weekly Progress</th>
                  <th className="py-3.5 px-4 text-center font-semibold w-36">Streak (Now / Best)</th>
                  <th className="py-3.5 pl-2 pr-6 text-right font-semibold w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredHabits.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-14 text-center">
                      <div className="max-w-sm mx-auto">
                        <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-80" />
                        <p className="font-semibold text-base">No habits match your filter</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Try clearing your search filter or create a new daily habit to track.
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-3">
                          <button
                            onClick={openAddModal}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition"
                          >
                            + Add Habit
                          </button>
                          <button
                            onClick={handleResetDemoData}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                              darkMode
                                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Reset Sample Data
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHabits.map((habit) => {
                    const theme = COLOR_THEMES[habit.color] || COLOR_THEMES.emerald;
                    return (
                      <tr
                        key={habit.id}
                        className={`group transition ${
                          darkMode ? 'hover:bg-slate-800/35' : 'hover:bg-slate-50/90'
                        }`}
                      >
                        {/* Habit Title & Meta */}
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${theme.bgSoft} ${theme.border} ${theme.text}`}
                            >
                              {renderHabitIcon(habit.icon, 'w-5 h-5')}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm sm:text-base truncate">
                                  {habit.name}
                                </p>
                                {habit.isGoalMet && (
                                  <span
                                    title="Weekly target achieved!"
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  >
                                    ★ Goal
                                  </span>
                                )}
                              </div>
                              <p
                                className={`text-xs truncate max-w-[230px] mt-0.5 ${
                                  darkMode ? 'text-slate-400' : 'text-slate-500'
                                }`}
                              >
                                {habit.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 7 Days Toggle Buttons */}
                        {weekDays.map((day) => {
                          const isChecked = !!habit.logs?.[day.key];
                          return (
                            <td key={day.key} className="py-3 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleDay(habit.id, day.key)}
                                aria-label={`Toggle ${habit.name} for ${day.fullName} ${day.dayNumber}`}
                                className={`w-10 h-10 rounded-xl inline-flex items-center justify-center transition-all duration-200 transform active:scale-90 ${
                                  isChecked
                                    ? `${theme.bg} text-white shadow-md shadow-black/20 ring-2 ${theme.ring}`
                                    : day.isToday
                                    ? darkMode
                                      ? 'bg-slate-800/90 border-2 border-dashed border-indigo-400/60 text-slate-400 hover:border-indigo-400 hover:bg-slate-800'
                                      : 'bg-indigo-50/60 border-2 border-dashed border-indigo-400/70 text-slate-400 hover:bg-indigo-100/50'
                                    : darkMode
                                    ? 'bg-slate-800/50 border border-slate-700/60 text-transparent hover:border-slate-600 hover:bg-slate-800'
                                    : 'bg-slate-100 border border-slate-200/80 text-transparent hover:border-slate-300 hover:bg-slate-200/60'
                                }`}
                              >
                                <Check
                                  className={`w-5 h-5 stroke-[2.75] transition-transform duration-200 ${
                                    isChecked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                                  }`}
                                />
                              </button>
                            </td>
                          );
                        })}

                        {/* Weekly Progress Column */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col items-center">
                            <div className="flex items-baseline justify-between w-full text-xs mb-1.5 px-1">
                              <span className="font-bold tabular-nums">
                                {habit.weekCompletions}/{habit.weeklyTarget}d
                              </span>
                              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                                {habit.weekProgressPct}%
                              </span>
                            </div>
                            <div
                              className={`w-full h-2 rounded-full overflow-hidden ${
                                darkMode ? 'bg-slate-800' : 'bg-slate-100'
                              }`}
                            >
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${theme.bg}`}
                                style={{ width: `${habit.weekProgressPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Current & Best Streak Badge */}
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700/50 bg-slate-800/30">
                            <div className="flex items-center gap-1 text-amber-400 font-bold text-sm tabular-nums" title="Current active streak">
                              <Flame
                                className={`w-4 h-4 ${
                                  habit.currentStreak > 0
                                    ? 'fill-amber-400 text-amber-400 animate-pulse'
                                    : 'text-slate-500'
                                }`}
                              />
                              <span>{habit.currentStreak}d</span>
                            </div>
                            <span className="text-slate-600">/</span>
                            <div
                              className={`flex items-center gap-1 text-xs font-semibold tabular-nums ${
                                darkMode ? 'text-slate-400' : 'text-slate-500'
                              }`}
                              title="Best streak record"
                            >
                              <Trophy className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{habit.bestStreak}d</span>
                            </div>
                          </div>
                        </td>

                        {/* Edit / Delete Actions */}
                        <td className="py-4 pl-2 pr-6 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(habit)}
                              title="Edit Habit"
                              className={`p-2 rounded-lg transition ${
                                darkMode
                                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setHabitToDelete(habit)}
                              title="Delete Habit"
                              className={`p-2 rounded-lg transition ${
                                darkMode
                                  ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                  : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer: Daily Completion Totals Row */}
              {filteredHabits.length > 0 && (
                <tfoot>
                  <tr
                    className={`border-t text-xs font-semibold ${
                      darkMode
                        ? 'bg-slate-950/50 border-slate-800/80 text-slate-400'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <td className="py-3 pl-6 pr-4">Daily Completion Rate</td>
                    {analytics.dailyStats.map((dayStat) => (
                      <td key={dayStat.key} className="py-3 px-2 text-center tabular-nums">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            dayStat.pct === 100
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : dayStat.pct >= 50
                              ? 'bg-indigo-500/15 text-indigo-400'
                              : darkMode
                              ? 'text-slate-500'
                              : 'text-slate-400'
                          }`}
                        >
                          {dayStat.pct}%
                        </span>
                      </td>
                    ))}
                    <td colSpan={3} className="py-3 px-6 text-right">
                      <button
                        onClick={handleResetDemoData}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Demo Data</span>
                      </button>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        {/* VISUAL WEEKLY PROGRESS & STREAK CHARTS SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          {/* LEFT 7 COLS: Interactive Weekly Streak & Daily Completion Chart */}
          <div
            className={`lg:col-span-7 rounded-3xl border p-6 flex flex-col justify-between ${
              darkMode
                ? 'bg-slate-900/90 border-slate-800/90'
                : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div>
              {/* Chart Header & Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-lg font-bold tracking-tight">
                      Weekly Streak & Progress Chart
                    </h2>
                  </div>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {activeChartTab === 'daily'
                      ? 'Daily completion percentage & cumulative streak momentum across the week'
                      : '28-day consistency matrix showing daily ritual adherence'}
                  </p>
                </div>

                <div
                  className={`inline-flex p-1 rounded-xl border self-start ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => setActiveChartTab('daily')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeChartTab === 'daily'
                        ? 'bg-indigo-600 text-white shadow'
                        : darkMode
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Weekly Chart
                  </button>
                  <button
                    onClick={() => setActiveChartTab('heatmap')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeChartTab === 'heatmap'
                        ? 'bg-indigo-600 text-white shadow'
                        : darkMode
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    28-Day Heatmap
                  </button>
                </div>
              </div>

              {/* TAB 1: Interactive SVG Combo Bar + Streak Trend Line Chart */}
              {activeChartTab === 'daily' ? (
                <div className="relative pt-2">
                  {/* Legend */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
                        <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                          Daily Completion (%)
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-amber-400 inline-block" />
                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block -ml-2" />
                        <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                          Avg Streak Momentum (Days)
                        </span>
                      </span>
                    </div>
                    {hoveredDayIndex !== null && analytics.dailyStats[hoveredDayIndex] && (
                      <div className="text-xs font-semibold text-indigo-400">
                        {analytics.dailyStats[hoveredDayIndex].fullName}:{' '}
                        {analytics.dailyStats[hoveredDayIndex].completed}/
                        {analytics.dailyStats[hoveredDayIndex].total} habits (
                        {analytics.dailyStats[hoveredDayIndex].pct}%) • Avg Streak:{' '}
                        {analytics.dailyStats[hoveredDayIndex].avgStreakLength}d
                      </div>
                    )}
                  </div>

                  {/* Custom Responsive SVG Chart */}
                  <div className="w-full h-64">
                    <svg
                      viewBox="0 0 560 220"
                      className="w-full h-full overflow-visible"
                      onMouseLeave={() => setHoveredDayIndex(null)}
                    >
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.95" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.45" />
                        </linearGradient>
                        <linearGradient id="barGradEmerald" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
                          <stop offset="100%" stopColor="#059669" stopOpacity="0.45" />
                        </linearGradient>
                        <linearGradient id="streakAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid Lines (0%, 25%, 50%, 75%, 100%) */}
                      {[0, 25, 50, 75, 100].map((val) => {
                        const y = 180 - (val / 100) * 150;
                        return (
                          <g key={val}>
                            <line
                              x1="36"
                              y1={y}
                              x2="540"
                              y2={y}
                              stroke={darkMode ? '#1e293b' : '#e2e8f0'}
                              strokeDasharray="4 4"
                              strokeWidth="1"
                            />
                            <text
                              x="28"
                              y={y + 4}
                              textAnchor="end"
                              className="text-[10px] fill-slate-500 font-medium"
                            >
                              {val}%
                            </text>
                          </g>
                        );
                      })}

                      {/* Bars for Each Day of the Week */}
                      {analytics.dailyStats.map((stat, idx) => {
                        const xCenter = 76 + idx * 72;
                        const barWidth = 34;
                        const barHeight = Math.max(4, (stat.pct / 100) * 150);
                        const yTop = 180 - barHeight;
                        const isHovered = hoveredDayIndex === idx;

                        return (
                          <g
                            key={stat.key}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredDayIndex(idx)}
                            onClick={() => setHoveredDayIndex(idx)}
                          >
                            {/* Hover column highlight */}
                            {isHovered && (
                              <rect
                                x={xCenter - 28}
                                y="20"
                                width="56"
                                height="165"
                                rx="10"
                                fill={darkMode ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.06)'}
                              />
                            )}

                            {/* Bar shadow / background track */}
                            <rect
                              x={xCenter - barWidth / 2}
                              y="30"
                              width={barWidth}
                              height="150"
                              rx="8"
                              fill={darkMode ? '#0f172a' : '#f1f5f9'}
                            />

                            {/* Value Bar */}
                            <rect
                              x={xCenter - barWidth / 2}
                              y={yTop}
                              width={barWidth}
                              height={barHeight}
                              rx="8"
                              fill={stat.pct === 100 ? 'url(#barGradEmerald)' : 'url(#barGrad)'}
                              className="transition-all duration-500"
                            />

                            {/* Percentage label above bar */}
                            <text
                              x={xCenter}
                              y={Math.max(22, yTop - 6)}
                              textAnchor="middle"
                              className={`text-[10px] font-bold ${
                                stat.pct === 100
                                  ? 'fill-emerald-400'
                                  : darkMode
                                  ? 'fill-slate-300'
                                  : 'fill-slate-700'
                              }`}
                            >
                              {stat.pct}%
                            </text>

                            {/* Day Label on X-axis */}
                            <text
                              x={xCenter}
                              y="200"
                              textAnchor="middle"
                              className={`text-[11px] font-semibold ${
                                stat.isToday
                                  ? 'fill-indigo-400 font-bold'
                                  : darkMode
                                  ? 'fill-slate-400'
                                  : 'fill-slate-600'
                              }`}
                            >
                              {stat.shortName}
                            </text>
                            <text
                              x={xCenter}
                              y="214"
                              textAnchor="middle"
                              className="text-[9px] fill-slate-500"
                            >
                              {stat.monthShort} {stat.dayNumber}
                            </text>
                          </g>
                        );
                      })}

                      {/* Overlay Streak Momentum Polyline */}
                      {(() => {
                        const maxAvgStreak = Math.max(
                          5,
                          ...analytics.dailyStats.map((s) => s.avgStreakLength)
                        );
                        const points = analytics.dailyStats.map((stat, idx) => {
                          const x = 76 + idx * 72;
                          const y = 175 - (stat.avgStreakLength / maxAvgStreak) * 130;
                          return { x, y, val: stat.avgStreakLength };
                        });
                        const linePath = points
                          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                          .join(' ');

                        return (
                          <g className="pointer-events-none">
                            <path
                              d={linePath}
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {points.map((p, idx) => (
                              <g key={idx}>
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r="4.5"
                                  fill={darkMode ? '#0f172a' : '#ffffff'}
                                  stroke="#f59e0b"
                                  strokeWidth="2.5"
                                />
                              </g>
                            ))}
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              ) : (
                /* TAB 2: 28-Day Consistency Heatmap Grid */
                <div className="pt-2">
                  <div className="grid grid-cols-7 gap-2.5">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dName) => (
                      <div
                        key={dName}
                        className="text-center text-xs font-semibold text-slate-400 pb-1"
                      >
                        {dName}
                      </div>
                    ))}
                    {heatmapDays.map((cell) => {
                      const pct = Math.round(cell.ratio * 100);
                      let bgClass = darkMode ? 'bg-slate-800/70 text-slate-400' : 'bg-slate-100 text-slate-500';
                      if (cell.ratio > 0 && cell.ratio < 0.4) {
                        bgClass = 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/30';
                      } else if (cell.ratio >= 0.4 && cell.ratio < 0.8) {
                        bgClass = 'bg-indigo-500/55 text-white border border-indigo-400/40';
                      } else if (cell.ratio >= 0.8) {
                        bgClass = 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30';
                      }

                      return (
                        <div
                          key={cell.key}
                          title={`${cell.label}: ${cell.count}/${enrichedHabits.length} habits (${pct}%)`}
                          className={`p-2.5 rounded-xl flex flex-col items-center justify-center transition transform hover:scale-105 ${bgClass} ${
                            cell.key === todayKey ? 'ring-2 ring-amber-400' : ''
                          }`}
                        >
                          <span className="text-[11px] font-bold">{cell.label}</span>
                          <span className="text-[10px] opacity-85 mt-0.5">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
                    <span>Past 4 weeks consistency overview</span>
                    <div className="flex items-center gap-1.5">
                      <span>Less</span>
                      <span className="w-3 h-3 rounded bg-slate-800 inline-block" />
                      <span className="w-3 h-3 rounded bg-indigo-500/30 inline-block" />
                      <span className="w-3 h-3 rounded bg-indigo-500/60 inline-block" />
                      <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                      <span>More</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Insight Banner inside Left Chart Card */}
            <div
              className={`mt-6 p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                darkMode
                  ? 'bg-slate-950/60 border-slate-800/80'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                  <Award className="w-4 h-4" />
                </div>
                <p className="text-xs leading-relaxed">
                  <strong className={darkMode ? 'text-slate-200' : 'text-slate-800'}>
                    Streak Tip:
                  </strong>{' '}
                  Toggle any day in the table above to see your weekly chart and streak bars update in real time.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-400 whitespace-nowrap">
                {analytics.weeklyCompletionRate}% Weekly Goal
              </span>
            </div>
          </div>

          {/* RIGHT 5 COLS: Habit Streak Comparison Leaderboard Chart */}
          <div
            className={`lg:col-span-5 rounded-3xl border p-6 flex flex-col justify-between ${
              darkMode
                ? 'bg-slate-900/90 border-slate-800/90'
                : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-bold tracking-tight">
                      Streak Leaderboard
                    </h2>
                  </div>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Current active streak vs. all-time best streak per habit
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400">
                  Current vs Best
                </span>
              </div>

              {/* Horizontal Dual-Bar Streak Comparison List */}
              <div className="space-y-4">
                {enrichedHabits.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">
                    Add habits to view your streak comparison chart.
                  </p>
                ) : (
                  enrichedHabits.map((habit) => {
                    const theme = COLOR_THEMES[habit.color] || COLOR_THEMES.emerald;
                    const maxScale = Math.max(14, analytics.allTimeBestStreak, habit.bestStreak);
                    const currentWidth = Math.min(
                      100,
                      Math.round((habit.currentStreak / maxScale) * 100)
                    );
                    const bestWidth = Math.min(
                      100,
                      Math.round((habit.bestStreak / maxScale) * 100)
                    );

                    return (
                      <div
                        key={habit.id}
                        className={`p-3.5 rounded-2xl border transition ${
                          darkMode
                            ? 'bg-slate-950/50 border-slate-800/80'
                            : 'bg-slate-50/70 border-slate-200/70'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="flex items-center gap-2 font-semibold truncate pr-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${theme.bg}`} />
                            <span className="truncate">{habit.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 tabular-nums">
                            <span className="text-amber-400 font-bold">
                              🔥 {habit.currentStreak}d
                            </span>
                            <span className="text-slate-500">/</span>
                            <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                              Best: {habit.bestStreak}d
                            </span>
                          </div>
                        </div>

                        {/* Layered Bar comparing Current Streak vs Best Streak */}
                        <div
                          className={`w-full h-3 rounded-full relative overflow-hidden ${
                            darkMode ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        >
                          {/* Best Streak Ghost Bar */}
                          <div
                            className="h-full rounded-full opacity-30 transition-all duration-500 absolute left-0 top-0"
                            style={{
                              width: `${bestWidth}%`,
                              backgroundColor: theme.hex
                            }}
                          />
                          {/* Current Active Streak Solid Bar */}
                          <div
                            className="h-full rounded-full transition-all duration-500 relative z-10"
                            style={{
                              width: `${currentWidth}%`,
                              backgroundColor: theme.hex
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Legend Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>Active Streak</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded-full bg-emerald-500/30 inline-block" />
                  <span>Personal Best</span>
                </span>
              </div>
              <span>Total Check-ins: {enrichedHabits.reduce((s, h) => s + h.totalCompleted, 0)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL 1: ADD / EDIT HABIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 sm:p-7 shadow-2xl transition ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                  {editingHabit ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <h3 className="text-lg font-bold">
                  {editingHabit ? 'Edit Habit' : 'Create New Habit'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="mt-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Habit Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
                  Habit Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Morning Mobility Flow (20m)"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  autoFocus
                />
              </div>

              {/* Description / Cue */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
                  Daily Trigger / Note
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g., Right after pouring morning coffee"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Category & Weekly Target Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
                    Weekly Goal ({formTarget} days/week)
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setFormTarget(num)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                          Number(formTarget) === num
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                            : darkMode
                            ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color Swatches */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-400">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  {Object.entries(COLOR_THEMES).map(([key, themeObj]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setFormColor(key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
                        formColor === key
                          ? `${themeObj.bgSoft} ${themeObj.border} ${themeObj.text} ring-2 ${themeObj.ring}`
                          : darkMode
                          ? 'bg-slate-950 border-slate-800 text-slate-400'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${themeObj.bg}`} />
                      <span>{themeObj.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-400">
                  Icon
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {ICON_OPTIONS.map((item) => {
                    const IconComp = item.Icon;
                    const selected = formIcon === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setFormIcon(item.id)}
                        title={item.label}
                        className={`p-2.5 rounded-xl flex items-center justify-center border transition ${
                          selected
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                            : darkMode
                            ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition ${
                    darkMode
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/25 transition"
                >
                  {editingHabit ? 'Save Changes' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CONFIRMATION (Custom Modal instead of window.confirm) */}
      {habitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Delete Habit?</h3>
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Are you sure you want to delete{' '}
              <strong className={darkMode ? 'text-white' : 'text-slate-900'}>
                "{habitToDelete.name}"
              </strong>
              ? This will remove its streak history and weekly logs.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setHabitToDelete(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                  darkMode
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Keep Habit
              </button>
              <button
                onClick={confirmDeleteHabit}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
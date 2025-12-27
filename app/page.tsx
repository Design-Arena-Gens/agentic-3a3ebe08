"use client";

import "@/app/styles/dashboard.css";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlarmClock,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Coffee,
  Dumbbell,
  Lightbulb,
  ListChecks,
  NotebookPen,
  Plus,
  Sun,
  Target,
  TimerReset
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";

type Priority = "High" | "Medium" | "Low";

type Task = {
  id: string;
  title: string;
  category: string;
  due?: string;
  priority: Priority;
  completed: boolean;
};

type Habit = {
  id: string;
  title: string;
  goal: string;
  streak: number;
  frequency: string;
};

type Note = {
  id: string;
  content: string;
  createdAt: number;
};

type AgentState = {
  tasks: Task[];
  habits: Habit[];
  notes: Note[];
};

const STORAGE_KEY = "agentic-3a3ebe08-state";

const sampleTasks: Task[] = [
  {
    id: "task-1",
    title: "Deep work block: ship priority feature",
    category: "Work",
    due: "09:30",
    priority: "High",
    completed: false
  },
  {
    id: "task-2",
    title: "Walk + podcast break",
    category: "Health",
    due: "12:30",
    priority: "Medium",
    completed: false
  },
  {
    id: "task-3",
    title: "Weekly alignment with team",
    category: "Work",
    due: "15:00",
    priority: "High",
    completed: false
  },
  {
    id: "task-4",
    title: "Plan tomorrow’s top three",
    category: "Planning",
    due: "20:45",
    priority: "Low",
    completed: false
  }
];

const sampleHabits: Habit[] = [
  {
    id: "habit-1",
    title: "Morning mobility",
    goal: "10 min stretch",
    streak: 5,
    frequency: "Daily"
  },
  {
    id: "habit-2",
    title: "Hydration",
    goal: "8 glasses",
    streak: 12,
    frequency: "All day"
  },
  {
    id: "habit-3",
    title: "Inbox zero sweep",
    goal: "2 check-ins",
    streak: 3,
    frequency: "Weekdays"
  }
];

const sampleNotes: Note[] = [
  {
    id: "note-1",
    content: "Focus theme: ruthless prioritisation over volume. Say no to distractions.",
    createdAt: Date.now() - 1000 * 60 * 45
  },
  {
    id: "note-2",
    content: "Dinner ingredients: salmon, broccoli, quinoa, miso paste.",
    createdAt: Date.now() - 1000 * 60 * 150
  }
];

const createInitialState = (): AgentState => ({
  tasks: sampleTasks,
  habits: sampleHabits,
  notes: sampleNotes
});

function safeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

function usePersistentState<T>(key: string, initializer: () => T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initializer();
    }

    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn("Failed reading stored state", error);
    }

    return initializer();
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("Failed persisting state", error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}

const priorityAccent: Record<Priority, string> = {
  High: "var(--danger)",
  Medium: "var(--accent)",
  Low: "var(--text-muted)"
};

const formatHour = (date: Date) =>
  date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

export default function HomePage() {
  const [tick, setTick] = useState(() => new Date());
  const [state, setState] = usePersistentState(STORAGE_KEY, createInitialState);
  const [taskDraft, setTaskDraft] = useState({
    title: "",
    category: "",
    due: "",
    priority: "Medium" as Priority
  });
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    const interval = window.setInterval(() => setTick(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const progress = useMemo(() => {
    const total = state.tasks.length || 1;
    const completed = state.tasks.filter((task) => task.completed).length;
    return Math.round((completed / total) * 100);
  }, [state.tasks]);

  const focusTasks = useMemo(
    () =>
      [...state.tasks]
        .filter((task) => !task.completed)
        .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
        .slice(0, 3),
    [state.tasks]
  );

  const timeline = useMemo(
    () => [
      {
        time: "07:00",
        label: "Morning ignition",
        details: ["Hydrate", "Light stretch", "Outline day wins"]
      },
      {
        time: "09:30",
        label: "Deep work sprint",
        details: ["Priority feature build", "Heads down focus window"]
      },
      {
        time: "12:30",
        label: "Recharge block",
        details: ["Walk", "Podcast queue", "Refuel lunch"]
      },
      {
        time: "15:00",
        label: "Team sync",
        details: ["Share status", "Remove blockers", "Assign next action"]
      },
      {
        time: "20:45",
        label: "Evening shutdown",
        details: ["Plan tomorrow", "Capture loose thoughts", "Gratitude note"]
      }
    ],
    []
  );

  const quickActions = useMemo(
    () => [
      {
        label: "Design tomorrow's big three",
        description: "Clarify what wins look like for the next day.",
        icon: <Target size={18} />,
        handler: () =>
          appendNote(
            "Tomorrow's Big Three:\n1. \n2. \n3. ",
            setState
          )
      },
      {
        label: "Energy reset protocol",
        description: "Mini reset when feeling scattered or low energy.",
        icon: <TimerReset size={18} />,
        handler: () =>
          appendNote(
            "Energy reset: 4-7-8 breathing (3 rounds), refill water, 3 sunlight minutes.",
            setState
          )
      },
      {
        label: "Capture gratitude",
        description: "Re-center by logging one thing you appreciate.",
        icon: <Sun size={18} />,
        handler: () => appendNote("Grateful for:", setState)
      },
      {
        label: "Delegate queue sweep",
        description: "List friction points to outsource or automate.",
        icon: <ClipboardList size={18} />,
        handler: () =>
          appendNote("Delegation candidates:\n- \n- \n- ", setState)
      }
    ],
    [setState]
  );

  function handleToggleTask(id: string) {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    }));
  }

  function handleAddTask() {
    if (!taskDraft.title.trim()) {
      return;
    }

    const task: Task = {
      id: safeId(),
      title: taskDraft.title.trim(),
      category: taskDraft.category.trim() || "General",
      due: taskDraft.due.trim() || undefined,
      priority: taskDraft.priority,
      completed: false
    };

    setState((prev) => ({
      ...prev,
      tasks: [task, ...prev.tasks]
    }));

    setTaskDraft({
      title: "",
      category: "",
      due: "",
      priority: taskDraft.priority
    });
  }

  function handleNoteCapture() {
    if (!noteDraft.trim()) {
      return;
    }

    appendNote(noteDraft.trim(), setState);
    setNoteDraft("");
  }

  function updateHabit(id: string, delta: number) {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              streak: Math.max(0, habit.streak + delta)
            }
          : habit
      )
    }));
  }

  return (
    <main className="page">
      <section className="hero">
        <motion.div
          className="surface-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="primary-pill">
            <CheckCircle2 /> Daily Command Center
          </span>
          <h2>{formatDate(tick)}</h2>
          <p style={{ fontSize: "3rem", fontWeight: 700, margin: "12px 0 0 0" }}>{formatHour(tick)}</p>
          <p>
            Momentum score today: <strong style={{ color: "var(--accent)" }}>{progress}%</strong>
          </p>
          <div className="tags">
            {focusTasks.map((task) => (
              <span key={task.id} className="tag" style={{ border: `1px solid ${priorityAccent[task.priority]}` }}>
                {task.title}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="surface-card surface-secondary"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h2>Daily Focus Brief</h2>
          <div className="timeline">
            {timeline.map((entry) => (
              <div key={entry.time} className="timeline-item">
                <div className="timeline-time">{entry.time}</div>
                <div className="timeline-brief">
                  <strong>{entry.label}</strong>
                  <span style={{ color: "var(--text-muted)" }}>{entry.details.join(" · ")}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="two-column">
        <motion.div
          className="surface-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <h2>
            <ListChecks style={{ marginRight: 10, verticalAlign: "middle" }} />
            Mission Control Tasks
          </h2>
          <p>Shape the day by deciding what matters most. Quick add below.</p>

          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <input
              placeholder="Task title"
              value={taskDraft.title}
              onChange={(event) => setTaskDraft((prev) => ({ ...prev, title: event.target.value }))}
              style={inputStyle}
            />
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
              <input
                placeholder="Category"
                value={taskDraft.category}
                onChange={(event) => setTaskDraft((prev) => ({ ...prev, category: event.target.value }))}
                style={inputStyle}
              />
              <input
                placeholder="Due (e.g. 14:30)"
                value={taskDraft.due}
                onChange={(event) => setTaskDraft((prev) => ({ ...prev, due: event.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <select
                value={taskDraft.priority}
                onChange={(event) => setTaskDraft((prev) => ({ ...prev, priority: event.target.value as Priority }))}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="High">High priority</option>
                <option value="Medium">Medium priority</option>
                <option value="Low">Low priority</option>
              </select>
              <button className="button" type="button" onClick={handleAddTask}>
                <Plus size={16} style={{ marginRight: 6 }} />
                Add task
              </button>
            </div>
          </div>

          <div className="tasks-list">
            <AnimatePresence>
              {state.tasks.map((task) => (
                <motion.div
                  key={task.id}
                  className={`task-item${task.completed ? " completed" : ""}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  layout
                >
                  <div className="task-details">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span>{task.category}</span>
                      {task.due && (
                        <span>
                          <AlarmClock size={14} style={{ marginRight: 4, verticalAlign: "text-top" }} />
                          {task.due}
                        </span>
                      )}
                      <span style={{ color: priorityAccent[task.priority] }}>{task.priority}</span>
                    </div>
                  </div>
                  <button className="button button-ghost" type="button" onClick={() => handleToggleTask(task.id)}>
                    {task.completed ? "Undo" : "Complete"}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          className="surface-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h2>
            <NotebookPen style={{ marginRight: 10, verticalAlign: "middle" }} />
            Thinking Canvas
          </h2>
          <p>Drop quick thoughts, shopping lists, sparks of insight. Nothing gets lost.</p>

          <div className="notes-area">
            <textarea
              placeholder="Capture thought..."
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
            />
            <button className="button" type="button" onClick={handleNoteCapture}>
              Save note
            </button>
          </div>

          <div className="notes-list">
            {state.notes.map((note) => (
              <div key={note.id} className="note-card">
                <div className="note-date">
                  {new Date(note.createdAt).toLocaleString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric"
                  })}
                </div>
                <div>{note.content}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="section-grid">
        <motion.div
          className="surface-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <h2>
            <Dumbbell style={{ marginRight: 10, verticalAlign: "middle" }} />
            Habits & Routines
          </h2>
          <p>Guardrails that keep you sharp. Update streaks as you go.</p>

          <div className="habit-list">
            {state.habits.map((habit) => (
              <div key={habit.id} className="habit-item">
                <div>
                  <strong>{habit.title}</strong>
                  <div style={{ color: "var(--text-muted)", marginTop: 4 }}>
                    {habit.goal} · {habit.frequency}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="habit-streak">{habit.streak}🔥</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="button button-ghost" type="button" onClick={() => updateHabit(habit.id, -1)}>
                      -
                    </button>
                    <button className="button" type="button" onClick={() => updateHabit(habit.id, 1)}>
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="surface-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h2>
            <Lightbulb style={{ marginRight: 10, verticalAlign: "middle" }} />
            Quick Actions
          </h2>
          <p>Trigger ready-made routines. Each action captures a tailored note.</p>

          <div className="quick-actions">
            {quickActions.map((action) => (
              <button key={action.label} className="quick-action button-ghost" type="button" onClick={action.handler}>
                <strong style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {action.icon}
                  {action.label}
                </strong>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{action.description}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="surface-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <h2>
            <Coffee style={{ marginRight: 10, verticalAlign: "middle" }} />
            Wind-down Blueprint
          </h2>
          <p>Close the loop so tomorrow starts fast.</p>
          <ul style={{ color: "var(--text-muted)", lineHeight: 1.7, paddingLeft: 20 }}>
            <li>Capture highlights & unfinished loops.</li>
            <li>Set tomorrow&apos;s focus + calendar reminder.</li>
            <li>Prep workspace: tools, hydration, to-do board.</li>
          </ul>
        </motion.div>

        <motion.div
          className="surface-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <h2>
            <Calendar style={{ marginRight: 10, verticalAlign: "middle" }} />
            Weekly Radar
          </h2>
          <p>Keep longer arcs in view so the daily grind aligns.</p>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            <RadarRow label="Deep work investment" value="8 hrs" icon={<Sun size={16} />} />
            <RadarRow label="Strategic conversations" value="3" icon={<Calendar size={16} />} />
            <RadarRow label="Personal growth" value="Book + 2 learnings" icon={<NotebookPen size={16} />} />
          </div>
        </motion.div>
      </section>
    </main>
  );
}

const inputStyle: CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(148, 163, 184, 0.2)",
  background: "rgba(15, 23, 42, 0.6)",
  padding: "12px 14px",
  color: "var(--text)",
  fontSize: "0.95rem",
  fontFamily: "inherit"
};

function priorityRank(priority: Priority) {
  if (priority === "High") return 0;
  if (priority === "Medium") return 1;
  return 2;
}

type StateSetter = Dispatch<SetStateAction<AgentState>>;

function appendNote(note: string, setState: StateSetter) {
  setState((prev) => ({
    ...prev,
    notes: [
      {
        id: safeId(),
        content: note,
        createdAt: Date.now()
      },
      ...prev.notes
    ]
  }));
}

type RadarRowProps = {
  label: string;
  value: string;
  icon: ReactNode;
};

function RadarRow({ label, value, icon }: RadarRowProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        background: "rgba(15, 23, 42, 0.65)",
        padding: "14px 16px",
        borderRadius: 16,
        border: "1px solid rgba(148, 163, 184, 0.1)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {icon}
        <span>{label}</span>
      </div>
      <strong style={{ color: "var(--accent)" }}>{value}</strong>
    </div>
  );
}

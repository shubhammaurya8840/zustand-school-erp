'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';

export const TasksChecklist: React.FC = () => {
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Read Chapter 5', completed: false },
    { id: '2', title: 'Submit Assignment', completed: true },
    { id: '3', title: 'Watch Lecture Video', completed: false },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
      <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-2">
        Tasks
      </h3>

      <div className="space-y-2.5 my-auto">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div
              className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                task.completed
                  ? 'bg-slate-800 text-white'
                  : 'border border-slate-300 bg-white/70 group-hover:border-slate-500'
              }`}
            >
              {task.completed && <Check className="w-3 h-3 stroke-[2.5]" />}
            </div>
            <span
              className={`text-xs font-medium transition-colors ${
                task.completed ? 'text-slate-800 font-semibold' : 'text-slate-600'
              }`}
            >
              {task.title}
            </span>
          </div>
        ))}
      </div>

      <div className="h-1" />
    </div>
  );
};

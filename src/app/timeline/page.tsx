"use client";

import { motion } from "framer-motion";
import { Heart, Plus, Trash2, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  emoji: string;
}

const DEFAULT_EVENTS: TimelineEvent[] = [
  {
    id: "1",
    title: "Ngày đầu tiên bên nhau",
    description: "Ngày bắt đầu chặng đường yêu thương của chúng mình",
    date: "2026-02-07",
    emoji: "💕",
  },
];

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>(DEFAULT_EVENTS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", emoji: "💕" });

  useEffect(() => {
    checkAuth();
    fetchEvents();
  }, []);

  async function checkAuth() {
    const { data } = await supabase.auth.getSession();
    setIsLoggedIn(!!data.session);
  }

  async function fetchEvents() {
    try {
      const { data } = await supabase
        .from("timeline_events")
        .select("*")
        .order("date", { ascending: true });
      if (data && data.length > 0) setEvents(data);
    } catch {
      // Use default events if Supabase not configured
    }
  }

  async function addEvent() {
    if (!form.title || !form.date) return;
    try {
      const { data } = await supabase
        .from("timeline_events")
        .insert([{ ...form }])
        .select()
        .single();
      if (data) setEvents((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
    } catch {
      // Fallback: add locally
      setEvents((prev) =>
        [...prev, { ...form, id: Date.now().toString() }].sort((a, b) =>
          a.date.localeCompare(b.date)
        )
      );
    }
    setForm({ title: "", description: "", date: "", emoji: "💕" });
    setShowForm(false);
  }

  async function deleteEvent(id: string) {
    try {
      await supabase.from("timeline_events").delete().eq("id", id);
    } catch {
      // ignore
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-rose-900 mb-2">
          Timeline of Us
        </h1>
        <p className="text-rose-400">Những mốc kỷ niệm đáng nhớ</p>
      </motion.div>

      {isLoggedIn && (
        <div className="text-center mb-8">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-md shadow-rose-200"
          >
            <Plus className="w-4 h-4" />
            Thêm kỷ niệm
          </button>
        </div>
      )}

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white rounded-2xl p-6 mb-8 border border-rose-100 shadow-lg"
        >
          <div className="grid gap-4">
            <input
              type="text"
              placeholder="Tiêu đề kỷ niệm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50"
            />
            <textarea
              placeholder="Mô tả..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50 resize-none"
              rows={3}
            />
            <div className="flex gap-4">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="flex-1 px-4 py-3 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50"
              />
              <select
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                className="px-4 py-3 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50 text-xl"
              >
                {["💕", "🎉", "✈️", "🎂", "📸", "🌟", "🎄", "🏖️", "🎓", "💍"].map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={addEvent}
              className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium"
            >
              Lưu kỷ niệm
            </button>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Center line */}
        <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-300 via-pink-300 to-purple-300 sm:-translate-x-0.5" />

        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
            className={`relative flex items-start mb-8 ${
              index % 2 === 0
                ? "sm:flex-row sm:pr-[calc(50%+2rem)]"
                : "sm:flex-row-reverse sm:pl-[calc(50%+2rem)]"
            } pl-16 sm:pl-0`}
          >
            {/* Dot */}
            <div className="absolute left-4 sm:left-1/2 sm:-translate-x-1/2 w-5 h-5 rounded-full bg-rose-400 border-4 border-white shadow-md z-10 flex items-center justify-center">
              <Heart className="w-2 h-2 text-white fill-white" />
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-md hover:shadow-lg transition-shadow w-full group">
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{event.emoji}</span>
                {isLoggedIn && event.id !== "1" && (
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="opacity-0 group-hover:opacity-100 text-rose-300 hover:text-rose-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h3 className="font-semibold text-rose-900 mt-2">{event.title}</h3>
              <p className="text-sm text-rose-400 mt-1">{event.description}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-rose-300">
                <Calendar className="w-3 h-3" />
                {new Date(event.date).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

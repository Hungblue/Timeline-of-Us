"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Check,
  Trash2,
  ListChecks,
  Sparkles,
  Filter,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BUCKET_CATEGORIES } from "@/lib/constants";

interface BucketItem {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  completed_date: string | null;
  created_by: string;
}

export default function BucketListPage() {
  const [items, setItems] = useState<BucketItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({ title: "", category: "travel" });

  useEffect(() => {
    checkAuth();
    fetchItems();
  }, []);

  async function checkAuth() {
    const { data } = await supabase.auth.getSession();
    setIsLoggedIn(!!data.session);
  }

  async function fetchItems() {
    try {
      const { data } = await supabase
        .from("bucket_list")
        .select("*")
        .order("completed", { ascending: true })
        .order("created_at", { ascending: false });
      if (data) setItems(data);
    } catch {
      // Supabase not configured
    }
  }

  async function addItem() {
    if (!form.title.trim()) return;
    try {
      const { data: session } = await supabase.auth.getSession();
      const { data } = await supabase
        .from("bucket_list")
        .insert([
          {
            title: form.title,
            category: form.category,
            completed: false,
            completed_date: null,
            created_by: session.session?.user?.email || "unknown",
          },
        ])
        .select()
        .single();
      if (data) setItems((prev) => [data, ...prev]);
    } catch {
      setItems((prev) => [
        {
          id: Date.now().toString(),
          title: form.title,
          category: form.category,
          completed: false,
          completed_date: null,
          created_by: "",
        },
        ...prev,
      ]);
    }
    setForm({ title: "", category: "travel" });
    setShowForm(false);
  }

  async function toggleComplete(item: BucketItem) {
    const updated = {
      completed: !item.completed,
      completed_date: !item.completed
        ? new Date().toISOString().split("T")[0]
        : null,
    };
    try {
      await supabase.from("bucket_list").update(updated).eq("id", item.id);
    } catch {
      // ignore
    }
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, ...updated } : i))
    );
  }

  async function deleteItem(id: string) {
    try {
      await supabase.from("bucket_list").delete().eq("id", id);
    } catch {
      // ignore
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const filtered =
    filter === "all"
      ? items
      : filter === "done"
        ? items.filter((i) => i.completed)
        : filter === "todo"
          ? items.filter((i) => !i.completed)
          : items.filter((i) => i.category === filter);

  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  function getCategoryInfo(value: string) {
    return BUCKET_CATEGORIES.find((c) => c.value === value) || BUCKET_CATEGORIES[4];
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-rose-900 mb-2">
          Bucket List
        </h1>
        <p className="text-rose-400">Những điều muốn làm cùng nhau</p>
      </motion.div>

      {/* Progress */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-rose-700">Tiến độ</span>
            <span className="text-sm text-rose-400">
              {completedCount}/{items.length} hoàn thành
            </span>
          </div>
          <div className="w-full h-3 bg-rose-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full"
            />
          </div>
        </motion.div>
      )}

      {/* Filter + Add */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-rose-300" />
        {[
          { value: "all", label: "Tất cả" },
          { value: "todo", label: "Chưa làm" },
          { value: "done", label: "Đã làm" },
          ...BUCKET_CATEGORIES,
        ].map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === cat.value
                ? "bg-rose-500 text-white shadow-sm"
                : "bg-white text-rose-500 border border-rose-200 hover:bg-rose-50"
            }`}
          >
            {"emoji" in cat ? `${cat.emoji} ` : ""}
            {cat.label}
          </button>
        ))}
      </div>

      {isLoggedIn && (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-md shadow-rose-200"
          >
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-lg">
              <input
                type="text"
                placeholder="Điều muốn làm cùng nhau..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                className="w-full px-4 py-3 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50 mb-4"
                autoFocus
              />
              <div className="flex flex-wrap gap-2 mb-4">
                {BUCKET_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setForm({ ...form, category: cat.value })}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      form.category === cat.value
                        ? "bg-rose-500 text-white"
                        : "bg-rose-50 text-rose-500 border border-rose-200"
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
              <button
                onClick={addItem}
                className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium"
              >
                Thêm vào danh sách
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <ListChecks className="w-16 h-16 text-rose-200 mx-auto mb-4" />
          <p className="text-rose-300 text-lg">Chưa có mục nào</p>
          <p className="text-rose-200 text-sm mt-1">
            {isLoggedIn
              ? 'Nhấn "Thêm mới" để bắt đầu!'
              : "Đăng nhập để thêm bucket list"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((item, index) => {
              const cat = getCategoryInfo(item.category);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group bg-white rounded-xl p-4 border transition-all ${
                    item.completed
                      ? "border-green-200 bg-green-50/50"
                      : "border-rose-100 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isLoggedIn ? (
                      <button
                        onClick={() => toggleComplete(item)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          item.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-rose-300 hover:border-rose-500"
                        }`}
                      >
                        {item.completed && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ) : (
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          item.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-rose-200"
                        }`}
                      >
                        {item.completed && <Check className="w-3.5 h-3.5" />}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium ${
                          item.completed
                            ? "text-green-700 line-through"
                            : "text-rose-900"
                        }`}
                      >
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-rose-50 text-rose-400 px-2 py-0.5 rounded-full">
                          {cat.emoji} {cat.label}
                        </span>
                        {item.completed && item.completed_date && (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {item.completed_date}
                          </span>
                        )}
                      </div>
                    </div>

                    {isLoggedIn && (
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-rose-300 hover:text-rose-500 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

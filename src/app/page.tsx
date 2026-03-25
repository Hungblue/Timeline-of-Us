"use client";

import { motion } from "framer-motion";
import { Heart, CalendarHeart, ArrowRight } from "lucide-react";
import Link from "next/link";
import LoveCounter from "@/components/LoveCounter";
import { COUPLE } from "@/lib/constants";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block mb-6"
        >
          <Heart className="w-16 h-16 text-rose-500 fill-rose-500 drop-shadow-lg" />
        </motion.div>

        <h1 className="text-4xl sm:text-6xl font-bold text-rose-900 mb-3">
          {COUPLE.person1}{" "}
          <span className="text-rose-400">&</span>{" "}
          {COUPLE.person2}
        </h1>

        <p className="text-rose-400 text-lg flex items-center justify-center gap-2">
          <CalendarHeart className="w-5 h-5" />
          Từ ngày 07.02.2026
        </p>
      </motion.div>

      {/* Love Counter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mb-16"
      >
        <LoveCounter />
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full"
      >
        {[
          {
            href: "/timeline",
            title: "Timeline",
            desc: "Dòng thời gian kỷ niệm",
            gradient: "from-rose-400 to-pink-500",
          },
          {
            href: "/gallery",
            title: "Gallery",
            desc: "Bộ sưu tập ảnh",
            gradient: "from-pink-400 to-purple-500",
          },
          {
            href: "/bucket-list",
            title: "Bucket List",
            desc: "Điều muốn làm cùng nhau",
            gradient: "from-purple-400 to-indigo-500",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-rose-100 hover:shadow-xl hover:shadow-rose-100 transition-all hover:-translate-y-1"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-3`}
            >
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <h3 className="font-semibold text-rose-900 mb-1">{item.title}</h3>
            <p className="text-sm text-rose-400 mb-3">{item.desc}</p>
            <span className="text-sm text-rose-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Xem ngay <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { COUPLE } from "@/lib/constants";

interface TimeElapsed {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
}

function calculateTime(startDate: string): TimeElapsed {
  const start = new Date(startDate);
  const now = new Date();

  const totalMs = now.getTime() - start.getTime();
  const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  return {
    years,
    months,
    days,
    hours: now.getHours(),
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
    totalDays,
  };
}

function CounterBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-rose-100 px-4 py-3 min-w-[70px] sm:min-w-[90px] border border-rose-100">
        <span className="text-2xl sm:text-4xl font-bold text-rose-600 tabular-nums block text-center">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs sm:text-sm text-rose-400 mt-2 font-medium">{label}</span>
    </div>
  );
}

export default function LoveCounter() {
  const [time, setTime] = useState<TimeElapsed | null>(null);

  useEffect(() => {
    setTime(calculateTime(COUPLE.startDate));
    const interval = setInterval(() => {
      setTime(calculateTime(COUPLE.startDate));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <div className="text-center">
      <p className="text-rose-400 text-sm mb-4 font-medium tracking-wide uppercase">
        Bên nhau đã
      </p>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {time.years > 0 && <CounterBox value={time.years} label="Năm" />}
        <CounterBox value={time.months} label="Tháng" />
        <CounterBox value={time.days} label="Ngày" />
        <CounterBox value={time.hours} label="Giờ" />
        <CounterBox value={time.minutes} label="Phút" />
        <CounterBox value={time.seconds} label="Giây" />
      </div>
      <p className="mt-6 text-rose-300 text-sm">
        Tổng cộng <span className="font-bold text-rose-500">{time.totalDays.toLocaleString()}</span> ngày yêu thương
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Mail, Send, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gửi email thất bại";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 border border-rose-100 shadow-lg max-w-sm w-full text-center"
        >
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-rose-900 mb-2">
            Kiểm tra hộp thư
          </h2>
          <p className="text-rose-400 text-sm mb-6">
            Nếu <span className="font-medium text-rose-500">{email}</span> có
            trong hệ thống, link đặt lại mật khẩu đã được gửi tới đó. Nhớ xem cả
            mục spam nhé.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-100 text-rose-600 rounded-full hover:bg-rose-200 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại đăng nhập
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 border border-rose-100 shadow-lg max-w-sm w-full"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-rose-900">Quên mật khẩu</h2>
          <p className="text-rose-400 text-sm mt-1">
            Nhập email, mình gửi link đặt lại cho
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              "Đang gửi..."
            ) : (
              <>
                <Send className="w-4 h-4" />
                Gửi link đặt lại
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-rose-400 hover:text-rose-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại đăng nhập
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

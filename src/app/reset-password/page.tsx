"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  Lock,
  KeyRound,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Status = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [linkError, setLinkError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Link hỏng/hết hạn: Supabase nhét lỗi thẳng vào hash thay vì token
    const params = new URLSearchParams(window.location.hash.substring(1));
    const errDesc = params.get("error_description");
    if (errDesc) {
      setLinkError(errDesc.replace(/\+/g, " "));
      setStatus("invalid");
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setStatus("ready");
    });

    // supabase-js đọc hash bất đồng bộ, nên getSession() ngay lúc này có thể
    // chưa thấy gì - chờ thêm một nhịp rồi mới kết luận link không hợp lệ
    let timer: ReturnType<typeof setTimeout> | undefined;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus("ready");
      } else {
        timer = setTimeout(() => {
          setStatus((s) => (s === "checking" ? "invalid" : s));
        }, 3000);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirm) {
      setError("Hai mật khẩu không khớp");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus("done");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Đổi mật khẩu thất bại";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 border border-rose-100 shadow-lg max-w-sm w-full"
      >
        {children}
      </motion.div>
    </div>
  );

  if (status === "checking") {
    return shell(
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse" />
        </div>
        <p className="text-rose-400 text-sm">Đang kiểm tra link...</p>
      </div>
    );
  }

  if (status === "invalid") {
    return shell(
      <div className="text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-rose-900 mb-2">
          Link không hợp lệ
        </h2>
        <p className="text-rose-400 text-sm mb-6">
          {linkError ||
            "Link đặt lại mật khẩu đã hết hạn hoặc được dùng rồi. Xin một link mới nhé."}
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-100 text-rose-600 rounded-full hover:bg-rose-200 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Xin link mới
        </Link>
      </div>
    );
  }

  if (status === "done") {
    return shell(
      <div className="text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-rose-900 mb-2">
          Đổi mật khẩu thành công
        </h2>
        <p className="text-rose-400 text-sm">Đang đưa bạn về trang chủ...</p>
      </div>
    );
  }

  return shell(
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-rose-900">Mật khẩu mới</h2>
        <p className="text-rose-400 text-sm mt-1">Đặt lại mật khẩu của bạn</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300" />
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300" />
          <input
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
            "Đang cập nhật..."
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              Cập nhật mật khẩu
            </>
          )}
        </button>
      </form>
    </>
  );
}

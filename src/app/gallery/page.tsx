"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Plus, X, Upload, Trash2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { staticPhotos } from "@/lib/photos";

interface Photo {
  id: string;
  url: string;
  caption: string;
  date?: string;
  uploaded_by?: string;
  isStatic?: boolean;
}

interface PendingPhoto {
  file: File;
  preview: string;
  key: string;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<PendingPhoto[]>([]);

  useEffect(() => {
    checkAuth();
    fetchPhotos();
  }, []);

  // Giữ bản mới nhất để cleanup lúc unmount không phải phụ thuộc vào state
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(
    () => () => {
      pendingRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
    },
    []
  );

  async function checkAuth() {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase.auth.getSession();
    setIsLoggedIn(!!data.session);
  }

  async function fetchPhotos() {
    // Always start with static photos
    const staticList: Photo[] = staticPhotos.map((p) => ({
      ...p,
      isStatic: true,
    }));

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase
          .from("photos")
          .select("*")
          .order("date", { ascending: false });
        if (data && data.length > 0) {
          // Supabase photos first, then static
          setPhotos([...data, ...staticList]);
          return;
        }
      } catch {
        // fallback to static
      }
    }

    setPhotos(staticList);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );

    if (picked.length) {
      setPending((prev) => {
        const seen = new Set(prev.map((p) => p.key));
        const added: PendingPhoto[] = [];
        for (const file of picked) {
          const key = `${file.name}-${file.size}`;
          if (seen.has(key)) continue;
          seen.add(key);
          added.push({ file, key, preview: URL.createObjectURL(file) });
        }
        return [...prev, ...added];
      });
      setUploadError("");
    }

    // Reset để chọn lại đúng file vừa bỏ ra vẫn kích hoạt onChange
    e.target.value = "";
  }

  function removePending(key: string) {
    setPending((prev) => {
      const hit = prev.find((p) => p.key === key);
      if (hit) URL.revokeObjectURL(hit.preview);
      return prev.filter((p) => p.key !== key);
    });
  }

  async function uploadPhotos() {
    if (!pending.length) return;

    const batch = pending;
    setUploading(true);
    setUploadError("");
    setProgress({ done: 0, total: batch.length });

    const { data: session } = await supabase.auth.getSession();
    const uploadedBy = session.session?.user?.email || "unknown";
    const today = new Date().toISOString().split("T")[0];

    const rows = [];
    const failed: string[] = [];

    for (let i = 0; i < batch.length; i++) {
      const { file } = batch[i];
      try {
        const ext = file.name.split(".").pop() || "jpg";
        // Date.now() một mình sẽ trùng khi nhiều file vào cùng mili-giây
        const rand = Math.random().toString(36).slice(2, 8);
        const filePath = `photos/${Date.now()}-${i}-${rand}.${ext}`;

        const { error: storageError } = await supabase.storage
          .from("gallery")
          .upload(filePath, file);
        if (storageError) throw storageError;

        const { data: urlData } = supabase.storage
          .from("gallery")
          .getPublicUrl(filePath);

        rows.push({
          url: urlData.publicUrl,
          caption: batch.length === 1 ? caption : "",
          date: today,
          uploaded_by: uploadedBy,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "lỗi không rõ";
        failed.push(`${file.name} (${msg})`);
      } finally {
        setProgress({ done: i + 1, total: batch.length });
      }
    }

    // Gom cả lô insert một lần thay vì mỗi ảnh một round trip
    if (rows.length) {
      const { data, error } = await supabase
        .from("photos")
        .insert(rows)
        .select();
      if (error) {
        failed.push(`không lưu được vào danh sách (${error.message})`);
      } else if (data) {
        setPhotos((prev) => [...data, ...prev]);
      }
    }

    batch.forEach((p) => URL.revokeObjectURL(p.preview));
    setPending([]);
    setCaption("");
    setProgress({ done: 0, total: 0 });
    setUploading(false);

    // Ảnh thành công vẫn được giữ, chỉ báo lại phần hỏng
    if (failed.length) {
      setUploadError(
        `${failed.length}/${batch.length} ảnh lỗi: ${failed.join("; ")}`
      );
    } else {
      setShowUpload(false);
    }
  }

  async function deletePhoto(photo: Photo) {
    if (photo.isStatic) return;
    if (!confirm("Xoá ảnh này?")) return;
    try {
      const urlParts = photo.url.split("/gallery/");
      if (urlParts[1]) {
        await supabase.storage.from("gallery").remove([urlParts[1]]);
      }
      await supabase.from("photos").delete().eq("id", photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-rose-900 mb-2">
          Gallery
        </h1>
        <p className="text-rose-400">Những khoảnh khắc đáng nhớ</p>
      </motion.div>

      {isLoggedIn && (
        <div className="text-center mb-8">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-md shadow-rose-200"
          >
            <Plus className="w-4 h-4" />
            Upload ảnh
          </button>
        </div>
      )}

      {/* Upload form */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-lg max-w-md mx-auto">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {pending.length === 0 ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-rose-200 rounded-xl flex flex-col items-center justify-center text-rose-300 hover:border-rose-400 hover:text-rose-400 transition-colors mb-4"
                >
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm">Chọn ảnh để upload</span>
                  <span className="text-xs mt-1 opacity-70">
                    Chọn được nhiều ảnh cùng lúc
                  </span>
                </button>
              ) : (
                <>
                  {pending.length === 1 ? (
                    <div className="relative mb-3">
                      <img
                        src={pending[0].preview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => removePending(pending[0].key)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {pending.map((p) => (
                        <div
                          key={p.key}
                          className="relative aspect-square group/thumb"
                        >
                          <img
                            src={p.preview}
                            alt={p.file.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removePending(p.key)}
                            className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-2 mb-4 text-sm text-rose-400 border border-dashed border-rose-200 rounded-xl hover:border-rose-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                  >
                    + Thêm ảnh
                  </button>
                </>
              )}

              {pending.length === 1 && (
                <input
                  type="text"
                  placeholder="Caption (tuỳ chọn)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50 mb-4"
                />
              )}

              {uploadError && (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl mb-4 break-words">
                  {uploadError}
                </p>
              )}

              <button
                onClick={uploadPhotos}
                disabled={!pending.length || uploading}
                className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading
                  ? `Đang upload ${progress.done}/${progress.total}...`
                  : pending.length > 1
                  ? `Upload ${pending.length} ảnh`
                  : "Upload"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <ImageIcon className="w-16 h-16 text-rose-200 mx-auto mb-4" />
          <p className="text-rose-300 text-lg">Chưa có ảnh nào</p>
          <p className="text-rose-200 text-sm mt-1">
            Đăng nhập để upload ảnh kỷ niệm
          </p>
        </motion.div>
      ) : (
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="break-inside-avoid group relative cursor-pointer"
              onClick={() => setLightbox(photo)}
            >
              <div className="relative rounded-2xl overflow-hidden bg-white border border-rose-100 shadow-sm hover:shadow-lg transition-shadow">
                <img
                  src={photo.url}
                  alt={photo.caption || "Kỷ niệm"}
                  className="w-full object-cover"
                  loading="lazy"
                />
                {photo.caption && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white text-sm font-medium">
                        {photo.caption}
                      </p>
                      {photo.date && (
                        <p className="text-white/70 text-xs mt-1">{photo.date}</p>
                      )}
                    </div>
                  </div>
                )}
                {isLoggedIn && !photo.isStatic && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhoto(photo);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={() => setLightbox(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-4xl max-h-[85vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightbox.url}
                alt={lightbox.caption || "Kỷ niệm"}
                className="max-h-[80vh] w-auto rounded-lg object-contain"
              />
              {lightbox.caption && (
                <div className="text-center mt-4">
                  <p className="text-white font-medium">{lightbox.caption}</p>
                  {lightbox.date && (
                    <p className="text-white/50 text-sm mt-1">{lightbox.date}</p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

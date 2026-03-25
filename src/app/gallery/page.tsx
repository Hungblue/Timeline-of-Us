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

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    checkAuth();
    fetchPhotos();
  }, []);

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
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadPhoto() {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("gallery")
        .getPublicUrl(filePath);

      const { data: session } = await supabase.auth.getSession();

      const { data } = await supabase
        .from("photos")
        .insert([
          {
            url: urlData.publicUrl,
            caption: caption,
            date: new Date().toISOString().split("T")[0],
            uploaded_by: session.session?.user?.email || "unknown",
          },
        ])
        .select()
        .single();

      if (data) setPhotos((prev) => [data, ...prev]);

      setCaption("");
      setPreview(null);
      setSelectedFile(null);
      setShowUpload(false);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload thất bại. Hãy kiểm tra cấu hình Supabase.");
    } finally {
      setUploading(false);
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
                onChange={handleFileSelect}
                className="hidden"
              />

              {preview ? (
                <div className="relative mb-4">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => {
                      setPreview(null);
                      setSelectedFile(null);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-rose-200 rounded-xl flex flex-col items-center justify-center text-rose-300 hover:border-rose-400 hover:text-rose-400 transition-colors mb-4"
                >
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm">Chọn ảnh để upload</span>
                </button>
              )}

              <input
                type="text"
                placeholder="Caption (tuỳ chọn)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-rose-50/50 mb-4"
              />

              <button
                onClick={uploadPhoto}
                disabled={!selectedFile || uploading}
                className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Đang upload..." : "Upload"}
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

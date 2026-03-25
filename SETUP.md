# Timeline of Us - Hướng dẫn Setup

## 1. Tạo tài khoản Supabase (miễn phí)

1. Vào https://supabase.com → **Start your project** → đăng ký bằng GitHub
2. Tạo project mới:
   - **Name**: `timeline-of-us`
   - **Database Password**: tạo password mạnh (lưu lại)
   - **Region**: Southeast Asia (Singapore)
3. Đợi project khởi tạo (~2 phút)

## 2. Tạo Database Tables

Vào **SQL Editor** trong Supabase Dashboard, chạy đoạn SQL sau:

```sql
-- Timeline events
CREATE TABLE timeline_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  emoji TEXT DEFAULT '💕',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Photos
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT,
  date DATE NOT NULL,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bucket list
CREATE TABLE bucket_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  completed BOOLEAN DEFAULT false,
  completed_date DATE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Row Level Security)
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_list ENABLE ROW LEVEL SECURITY;

-- Policies: anyone can read, only authenticated users can write
CREATE POLICY "Anyone can read timeline" ON timeline_events FOR SELECT USING (true);
CREATE POLICY "Auth users can insert timeline" ON timeline_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete timeline" ON timeline_events FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can read photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Auth users can insert photos" ON photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete photos" ON photos FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can read bucket_list" ON bucket_list FOR SELECT USING (true);
CREATE POLICY "Auth users can insert bucket_list" ON bucket_list FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update bucket_list" ON bucket_list FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete bucket_list" ON bucket_list FOR DELETE USING (auth.role() = 'authenticated');
```

## 3. Tạo Storage Bucket cho ảnh

1. Vào **Storage** trong Supabase Dashboard
2. Click **New bucket**
3. Name: `gallery`
4. **Public bucket**: BẬT (toggle on)
5. Click **Create bucket**
6. Vào bucket `gallery` → **Policies** → **New Policy**:
   - Select: cho phép tất cả (anyone can read)
   - Insert/Delete: chỉ authenticated users

Hoặc chạy SQL:

```sql
-- Storage policies
CREATE POLICY "Anyone can view gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Auth users can upload to gallery" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete from gallery" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND auth.role() = 'authenticated');
```

## 4. Tạo tài khoản cho Felix & Hana

1. Vào **Authentication** → **Users** → **Add user**
2. Tạo 2 tài khoản:
   - Email: `felix@email.com` / Password: (tự chọn)
   - Email: `hana@email.com` / Password: (tự chọn)

## 5. Lấy API Keys

1. Vào **Settings** → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 6. Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục project:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 7. Chạy local

```bash
npm run dev
```

Mở http://localhost:3000

## 8. Deploy lên Vercel

1. Push code lên GitHub:
```bash
git init
git add .
git commit -m "Initial commit: Timeline of Us"
git remote add origin https://github.com/YOUR_USERNAME/timeline-of-us.git
git push -u origin main
```

2. Vào https://vercel.com → **Import Project** → chọn repo
3. Thêm Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**

Done! Website sẽ live tại `https://timeline-of-us.vercel.app`


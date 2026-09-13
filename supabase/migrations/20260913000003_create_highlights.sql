CREATE TABLE IF NOT EXISTS highlights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  image_url text NOT NULL,
  size text DEFAULT '',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Highlights are viewable by everyone" ON highlights
  FOR SELECT USING (true);

-- Allow admin full access (using dev-mode permissive RLS like the rest of the app)
CREATE POLICY "highlights_anon_all" ON highlights
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.face_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  descriptors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.face_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on face_profiles" ON public.face_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on face_profiles" ON public.face_profiles FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on face_profiles" ON public.face_profiles FOR UPDATE TO public USING (true);
CREATE POLICY "Allow all delete on face_profiles" ON public.face_profiles FOR DELETE TO public USING (true);
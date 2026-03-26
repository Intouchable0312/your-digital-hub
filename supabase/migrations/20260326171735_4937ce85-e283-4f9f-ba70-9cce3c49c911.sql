
CREATE TABLE public.face_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  descriptors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.face_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.face_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert" ON public.face_profiles FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.face_profiles FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete" ON public.face_profiles FOR DELETE TO public USING (true);

CREATE TRIGGER update_face_profiles_updated_at
  BEFORE UPDATE ON public.face_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

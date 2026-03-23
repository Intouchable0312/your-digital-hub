-- Create a table for user tabs/bookmarks
CREATE TABLE public.tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'globe',
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tabs ENABLE ROW LEVEL SECURITY;

-- Since this is a personal site with PIN protection (no auth), allow all operations
CREATE POLICY "Allow all select" ON public.tabs FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.tabs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.tabs FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.tabs FOR DELETE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tabs_updated_at
  BEFORE UPDATE ON public.tabs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
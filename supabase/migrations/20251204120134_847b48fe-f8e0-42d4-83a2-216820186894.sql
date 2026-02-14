-- Create leads table for capturing potential customers
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT,
  source TEXT NOT NULL DEFAULT 'popup', -- 'popup', 'newsletter', 'exit_intent'
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert leads (public form submission)
CREATE POLICY "Anyone can submit leads"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- Only admins can view leads
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update leads
CREATE POLICY "Admins can update leads"
ON public.leads
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete leads
CREATE POLICY "Admins can delete leads"
ON public.leads
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
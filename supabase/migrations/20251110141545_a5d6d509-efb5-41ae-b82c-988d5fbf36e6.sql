-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.application_status AS ENUM ('draft', 'submitted', 'in_review', 'completed', 'rejected');
CREATE TYPE public.visa_type AS ENUM ('tourist', 'business', 'medical', 'conference', 'student', 'other');
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other');
CREATE TYPE public.document_type AS ENUM ('photo', 'passport', 'business_card', 'invitation_letter', 'hospital_letter', 'conference_docs', 'other');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Countries table
CREATE TABLE public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  isd_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- Airports/seaports table
CREATE TABLE public.arrival_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  type TEXT NOT NULL, -- 'airport' or 'seaport'
  city TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.arrival_points ENABLE ROW LEVEL SECURITY;

-- Pricing configuration
CREATE TABLE public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_type visa_type NOT NULL,
  duration TEXT NOT NULL,
  country_code TEXT,
  base_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  convenience_fee DECIMAL(10, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- Visa applications table
CREATE TABLE public.visa_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Personal Information
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender gender NOT NULL,
  nationality TEXT NOT NULL,
  passport_number TEXT NOT NULL,
  passport_issue_date DATE NOT NULL,
  passport_expiry_date DATE NOT NULL,
  place_of_birth TEXT NOT NULL,
  country_of_birth TEXT NOT NULL,
  
  -- Contact Information
  email TEXT NOT NULL,
  mobile_isd TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  residential_address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  
  -- Visa Details
  visa_type visa_type NOT NULL,
  visa_type_other TEXT,
  duration_of_stay TEXT NOT NULL,
  intended_arrival_date DATE NOT NULL,
  arrival_point_id UUID REFERENCES public.arrival_points(id),
  purpose_of_visit TEXT,
  
  -- Travel Information
  indian_contact_address TEXT NOT NULL,
  indian_contact_person TEXT,
  indian_contact_phone TEXT,
  previous_visa_details TEXT,
  visa_refused_before BOOLEAN DEFAULT false,
  visa_refusal_details TEXT,
  
  -- Status & Metadata
  status application_status DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_autosave_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.visa_applications ENABLE ROW LEVEL SECURITY;

-- Application documents table
CREATE TABLE public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.visa_applications(id) ON DELETE CASCADE NOT NULL,
  document_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.visa_applications(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  
  -- PayPal details
  paypal_order_id TEXT UNIQUE NOT NULL,
  paypal_capture_id TEXT,
  payer_email TEXT,
  payer_name TEXT,
  
  -- Transaction details
  service_name TEXT NOT NULL,
  country TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  convenience_fee DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status payment_status DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  captured_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Messages table for applicant-admin communication
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.visa_applications(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_admin_message BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Email templates table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_visa_applications_updated_at
  BEFORE UPDATE ON public.visa_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_config_updated_at
  BEFORE UPDATE ON public.pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- user_roles: Only admins can view/manage roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- countries: Public read, admin write
CREATE POLICY "Anyone can view active countries"
  ON public.countries FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage countries"
  ON public.countries FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- arrival_points: Public read, admin write
CREATE POLICY "Anyone can view active arrival points"
  ON public.arrival_points FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage arrival points"
  ON public.arrival_points FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- pricing_config: Public read active prices, admin write
CREATE POLICY "Anyone can view active pricing"
  ON public.pricing_config FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage pricing"
  ON public.pricing_config FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- visa_applications: Users see own, admins see all
CREATE POLICY "Users can view own applications"
  ON public.visa_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own applications"
  ON public.visa_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft applications"
  ON public.visa_applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any application"
  ON public.visa_applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own draft applications"
  ON public.visa_applications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft');

-- application_documents: Users see own, admins see all
CREATE POLICY "Users can view own documents"
  ON public.application_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.visa_applications
      WHERE id = application_id AND user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can upload documents to own applications"
  ON public.application_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.visa_applications
      WHERE id = application_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own documents"
  ON public.application_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.visa_applications
      WHERE id = application_id AND user_id = auth.uid() AND status = 'draft'
    )
  );

-- payments: Users see own, admins see all
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- messages: Users see messages for their applications, admins see all
CREATE POLICY "Users can view messages for own applications"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can send messages for own applications"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Admins can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- email_templates: Admins only
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- audit_logs: Admins only
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert seed data
INSERT INTO public.countries (code, name, isd_code) VALUES
  ('AE', 'United Arab Emirates', '+971'),
  ('IN', 'India', '+91'),
  ('US', 'United States', '+1'),
  ('GB', 'United Kingdom', '+44'),
  ('SA', 'Saudi Arabia', '+966'),
  ('PK', 'Pakistan', '+92'),
  ('BD', 'Bangladesh', '+880'),
  ('LK', 'Sri Lanka', '+94'),
  ('NP', 'Nepal', '+977'),
  ('PH', 'Philippines', '+63');

INSERT INTO public.arrival_points (name, code, type, city) VALUES
  ('Indira Gandhi International Airport', 'DEL', 'airport', 'New Delhi'),
  ('Chhatrapati Shivaji Maharaj International Airport', 'BOM', 'airport', 'Mumbai'),
  ('Kempegowda International Airport', 'BLR', 'airport', 'Bangalore'),
  ('Chennai International Airport', 'MAA', 'airport', 'Chennai'),
  ('Netaji Subhas Chandra Bose International Airport', 'CCU', 'airport', 'Kolkata'),
  ('Rajiv Gandhi International Airport', 'HYD', 'airport', 'Hyderabad'),
  ('Cochin International Airport', 'COK', 'airport', 'Kochi'),
  ('Goa International Airport', 'GOI', 'airport', 'Goa'),
  ('Mumbai Port', 'INMUM', 'seaport', 'Mumbai'),
  ('Chennai Port', 'INMAA', 'seaport', 'Chennai');

INSERT INTO public.pricing_config (visa_type, duration, country_code, base_amount, currency, convenience_fee, tax_rate) VALUES
  ('tourist', '30 days', NULL, 120.00, 'AED', 10.00, 5.00),
  ('tourist', '1 year', NULL, 350.00, 'AED', 20.00, 5.00),
  ('tourist', '5 years', NULL, 850.00, 'AED', 30.00, 5.00),
  ('business', '30 days', NULL, 150.00, 'AED', 15.00, 5.00),
  ('business', '1 year', NULL, 450.00, 'AED', 25.00, 5.00),
  ('medical', '60 days', NULL, 200.00, 'AED', 15.00, 5.00),
  ('conference', '30 days', NULL, 130.00, 'AED', 10.00, 5.00),
  ('student', '1 year', NULL, 400.00, 'AED', 20.00, 5.00);

INSERT INTO public.email_templates (template_key, subject, body, variables) VALUES
  ('registration_verification', 'Verify Your Email - Visa4Less', 
   'Hi {{full_name}},\n\nWelcome to Visa4Less! Please verify your email address by clicking the link below:\n\n{{verification_link}}\n\nBest regards,\nVisa4Less Team', 
   '{"full_name": "User full name", "verification_link": "Email verification URL"}'),
  
  ('application_saved', 'Your Visa Application Draft Saved', 
   'Hi {{full_name}},\n\nYour visa application (Application ID: {{application_id}}) has been saved as a draft. You can complete it anytime by logging into your account.\n\nBest regards,\nVisa4Less Team', 
   '{"full_name": "User full name", "application_id": "Application ID"}'),
  
  ('application_submitted', 'Visa Application Submitted Successfully', 
   'Hi {{full_name}},\n\nYour visa application ({{application_id}}) has been submitted successfully. We will review it and get back to you soon.\n\nApplication Details:\n- Visa Type: {{visa_type}}\n- Duration: {{duration}}\n- Status: Submitted\n\nBest regards,\nVisa4Less Team', 
   '{"full_name": "User full name", "application_id": "Application ID", "visa_type": "Visa type", "duration": "Duration of stay"}'),
  
  ('payment_receipt', 'Payment Receipt - Visa4Less', 
   'Hi {{full_name}},\n\nThank you for your payment! Here are your payment details:\n\nTransaction ID: {{transaction_id}}\nAmount: {{amount}} {{currency}}\nService: {{service_name}}\nStatus: {{status}}\n\nYou can download your invoice from your account dashboard.\n\nBest regards,\nVisa4Less Team', 
   '{"full_name": "User full name", "transaction_id": "PayPal transaction ID", "amount": "Amount paid", "currency": "Currency", "service_name": "Service name", "status": "Payment status"}'),
  
  ('status_update', 'Visa Application Status Update', 
   'Hi {{full_name}},\n\nYour visa application ({{application_id}}) status has been updated to: {{status}}\n\n{{message}}\n\nBest regards,\nVisa4Less Team', 
   '{"full_name": "User full name", "application_id": "Application ID", "status": "New status", "message": "Custom message"}'),
  
  ('reminder_draft', 'Complete Your Visa Application', 
   'Hi {{full_name}},\n\nWe noticed you started a visa application ({{application_id}}) but haven''t completed it yet. Complete your application now to process your visa faster!\n\nLogin here: {{login_link}}\n\nBest regards,\nVisa4Less Team', 
   '{"full_name": "User full name", "application_id": "Application ID", "login_link": "Login URL"}');

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visa-documents',
  'visa-documents',
  false,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
);

-- Storage policies for visa documents
CREATE POLICY "Users can upload documents to own applications"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'visa-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'visa-documents' AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Users can delete own documents from draft applications"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'visa-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can view all documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'visa-documents' AND
    public.has_role(auth.uid(), 'admin')
  );
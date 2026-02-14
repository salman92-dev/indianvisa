import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentCredits } from "@/hooks/usePaymentCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Lock, Save, LogOut } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApplicationData, getDefaultApplicationData } from "@/types/visa-application";
import SaveIndicator from "@/components/SaveIndicator";
import { validateApplicantEligibility } from "@/lib/visaEligibilityValidation";

// Import all form tabs
import ApplicantDetailsTab from "@/components/visa-application/ApplicantDetailsTab";
import PassportDetailsTab from "@/components/visa-application/PassportDetailsTab";
import AddressDetailsTab from "@/components/visa-application/AddressDetailsTab";
import FamilyDetailsTab from "@/components/visa-application/FamilyDetailsTab";
import VisaDetailsTabNew from "@/components/visa-application/VisaDetailsTabNew";
import PreviousVisaTab from "@/components/visa-application/PreviousVisaTab";
import ReferencesTab from "@/components/visa-application/ReferencesTab";
import SecurityQuestionsTab from "@/components/visa-application/SecurityQuestionsTab";
import UploadsTab from "@/components/visa-application/UploadsTab";

const ApplyVisa = () => {
  const { user, session, loading: authLoading } = useAuth();
  const { availableCredits, useCredit, loading: creditsLoading } = usePaymentCredits();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationIdFromUrl = searchParams.get("id");
  const useCreditFromUrl = searchParams.get("useCredit") === "true";
  const [activeTab, setActiveTab] = useState("applicant");
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [creatingWithCredit, setCreatingWithCredit] = useState(false);
  const [documentsUploaded, setDocumentsUploaded] = useState({ photo: false, passport: false });
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriedCreditCreation = useRef(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [applicationData, setApplicationData] = useState<ApplicationData>(getDefaultApplicationData(user?.email));

  // Redirect only after auth has fully resolved (never during render)
  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, session, navigate]);

  const tabs = [
    { value: "applicant", label: "Applicant", step: 1 },
    { value: "passport", label: "Passport", step: 2 },
    { value: "address", label: "Address", step: 3 },
    { value: "family", label: "Family", step: 4 },
    { value: "visa", label: "Visa Details", step: 5 },
    { value: "previous", label: "Previous Visa", step: 6 },
    { value: "references", label: "References", step: 7 },
    { value: "security", label: "Security", step: 8 },
    { value: "uploads", label: "Documents", step: 9 },
  ];

  const currentTabIndex = tabs.findIndex((tab) => tab.value === activeTab);
  const progress = ((currentTabIndex + 1) / tabs.length) * 100;

  // Define required fields with human-readable labels for validation
  const getRequiredFieldsStatus = () => {
    const requiredFields: { key: string; label: string; value: any; tab: string }[] = [
      // Applicant Details (Tab 1)
      { key: 'surname', label: 'Surname', value: applicationData.surname, tab: 'Applicant' },
      { key: 'given_name', label: 'Given Name', value: applicationData.given_name, tab: 'Applicant' },
      { key: 'date_of_birth', label: 'Date of Birth', value: applicationData.date_of_birth, tab: 'Applicant' },
      { key: 'gender', label: 'Gender', value: applicationData.gender, tab: 'Applicant' },
      { key: 'nationality', label: 'Nationality', value: applicationData.nationality, tab: 'Applicant' },
      { key: 'place_of_birth', label: 'Place of Birth', value: applicationData.place_of_birth, tab: 'Applicant' },
      { key: 'country_of_birth', label: 'Country of Birth', value: applicationData.country_of_birth, tab: 'Applicant' },
      // Passport Details (Tab 2)
      { key: 'passport_number', label: 'Passport Number', value: applicationData.passport_number, tab: 'Passport' },
      { key: 'passport_place_of_issue', label: 'Passport Place of Issue', value: applicationData.passport_place_of_issue, tab: 'Passport' },
      { key: 'passport_issue_date', label: 'Passport Issue Date', value: applicationData.passport_issue_date, tab: 'Passport' },
      { key: 'passport_expiry_date', label: 'Passport Expiry Date', value: applicationData.passport_expiry_date, tab: 'Passport' },
      // Address Details (Tab 3)
      { key: 'email', label: 'Email', value: applicationData.email, tab: 'Address' },
      { key: 'mobile_number', label: 'Mobile Number', value: applicationData.mobile_number, tab: 'Address' },
      { key: 'present_address_house_street', label: 'House/Street Address', value: applicationData.present_address_house_street, tab: 'Address' },
      { key: 'present_address_village_town', label: 'Village/Town/City', value: applicationData.present_address_village_town, tab: 'Address' },
      { key: 'present_address_country', label: 'Country', value: applicationData.present_address_country, tab: 'Address' },
      // Family Details (Tab 4)
      { key: 'father_name', label: "Father's Name", value: applicationData.father_name, tab: 'Family' },
      { key: 'father_nationality', label: "Father's Nationality", value: applicationData.father_nationality, tab: 'Family' },
      { key: 'mother_name', label: "Mother's Name", value: applicationData.mother_name, tab: 'Family' },
      { key: 'mother_nationality', label: "Mother's Nationality", value: applicationData.mother_nationality, tab: 'Family' },
      { key: 'marital_status', label: 'Marital Status', value: applicationData.marital_status, tab: 'Family' },
      // Visa Details (Tab 5)
      { key: 'visa_type', label: 'Visa Type', value: applicationData.visa_type, tab: 'Visa Details' },
      { key: 'duration_of_stay', label: 'Duration of Stay', value: applicationData.duration_of_stay, tab: 'Visa Details' },
      { key: 'intended_arrival_date', label: 'Intended Arrival Date', value: applicationData.intended_arrival_date, tab: 'Visa Details' },
      { key: 'arrival_point_id', label: 'Port of Arrival', value: applicationData.arrival_point_id, tab: 'Visa Details' },
      // References (Tab 7)
      { key: 'reference_india_name', label: 'Reference in India (Name)', value: applicationData.reference_india_name, tab: 'References' },
      { key: 'reference_india_address', label: 'Reference in India (Address)', value: applicationData.reference_india_address, tab: 'References' },
      { key: 'reference_india_phone', label: 'Reference in India (Phone)', value: applicationData.reference_india_phone, tab: 'References' },
      { key: 'reference_home_name', label: 'Reference in Home Country (Name)', value: applicationData.reference_home_name, tab: 'References' },
      { key: 'reference_home_address', label: 'Reference in Home Country (Address)', value: applicationData.reference_home_address, tab: 'References' },
      { key: 'reference_home_phone', label: 'Reference in Home Country (Phone)', value: applicationData.reference_home_phone, tab: 'References' },
    ];

    const missingFields = requiredFields.filter(
      field => !field.value || field.value.toString().trim() === ''
    );

    // Group by tab for display
    const missingByTab: Record<string, string[]> = {};
    missingFields.forEach(field => {
      if (!missingByTab[field.tab]) {
        missingByTab[field.tab] = [];
      }
      missingByTab[field.tab].push(field.label);
    });

    return {
      missingFields,
      missingByTab,
      allFieldsFilled: missingFields.length === 0,
    };
  };

  // Check if all required fields are filled
  const isFormComplete = () => {
    const { allFieldsFilled, missingFields, missingByTab } = getRequiredFieldsStatus();
    
    // Log missing fields for debugging
    if (!allFieldsFilled || !documentsUploaded.photo || !documentsUploaded.passport || !applicationData.declaration_accepted) {
      console.log('=== Form Completion Status ===');
      if (missingFields.length > 0) {
        console.log('Missing required fields:', missingFields.map(f => `${f.tab}: ${f.label}`));
        console.log('Missing by tab:', missingByTab);
      }
      if (!documentsUploaded.photo) console.log('Missing: Photo document');
      if (!documentsUploaded.passport) console.log('Missing: Passport scan');
      if (!applicationData.declaration_accepted) console.log('Missing: Declaration not accepted');
      console.log('==============================');
    }
    
    return allFieldsFilled && documentsUploaded.photo && documentsUploaded.passport && applicationData.declaration_accepted;
  };

  // Get missing items for display
  const getMissingItems = () => {
    const { missingByTab } = getRequiredFieldsStatus();
    const items: string[] = [];
    
    Object.entries(missingByTab).forEach(([tab, fields]) => {
      items.push(`${tab}: ${fields.slice(0, 2).join(', ')}${fields.length > 2 ? ` (+${fields.length - 2} more)` : ''}`);
    });
    
    if (!documentsUploaded.photo) items.push('Documents: Photo');
    if (!documentsUploaded.passport) items.push('Documents: Passport scan');
    if (!applicationData.declaration_accepted) items.push('Documents: Accept declaration');
    
    return items;
  };

  // Auto-save immediately on data changes (debounced to prevent excessive calls)
  useEffect(() => {
    // Only require id to save - don't require surname so we can save any field change
    if (!isSubmitted && applicationData.id) {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      autoSaveRef.current = setTimeout(() => {
        saveApplication(false);
      }, 300); // Small debounce to batch rapid changes
    }
    
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [isSubmitted, applicationData]);

  // Save on visibility change (when user switches browser tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && applicationData.id && !isSubmitted) {
        // Immediately save when user leaves the tab
        saveApplication(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [applicationData.id, isSubmitted]);

  // Save on tab change
  const handleTabChange = (newTab: string) => {
    if (applicationData.id && !isSubmitted) {
      saveApplication(false);
    }
    setActiveTab(newTab);
  };

  // Create new application using payment credit
  const createApplicationWithCredit = async () => {
    if (!user || availableCredits === 0) return;

    setCreatingWithCredit(true);
    try {
      const defaultData = getDefaultApplicationData(user.email);
      
      // Calculate valid dates that pass the database trigger validation:
      // - date_of_birth: 25 years ago (valid age)
      // - passport_issue_date: 1 year ago
      // - passport_expiry_date: 2 years from now (well beyond 6 months)
      // - intended_arrival_date: 30 days from now
      const today = new Date();
      const dateOfBirth = new Date(today);
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 25);
      
      const passportIssueDate = new Date(today);
      passportIssueDate.setFullYear(passportIssueDate.getFullYear() - 1);
      
      const passportExpiryDate = new Date(today);
      passportExpiryDate.setFullYear(passportExpiryDate.getFullYear() + 2);
      
      const intendedArrivalDate = new Date(today);
      intendedArrivalDate.setDate(intendedArrivalDate.getDate() + 30);

      const { data: newApp, error: createError } = await supabase
        .from("visa_applications")
        .insert({
          user_id: user.id,
          full_name: "",
          date_of_birth: dateOfBirth.toISOString().split("T")[0],
          gender: "male",
          nationality: "",
          passport_number: "",
          passport_issue_date: passportIssueDate.toISOString().split("T")[0],
          passport_expiry_date: passportExpiryDate.toISOString().split("T")[0],
          place_of_birth: "",
          country_of_birth: "",
          email: user.email || "",
          mobile_isd: "+971",
          mobile_number: "",
          residential_address: "",
          city: "",
          country: "",
          visa_type: "tourist",
          duration_of_stay: "30 days",
          intended_arrival_date: intendedArrivalDate.toISOString().split("T")[0],
          indian_contact_address: "",
          status: "draft",
        })
        .select("id")
        .maybeSingle();

      console.log("Insert response:", { newApp, createError });

      if (createError) {
        console.error("Supabase insert error:", createError);
        throw createError;
      }

      if (!newApp?.id) {
        throw new Error("Application created but no ID was returned");
      }

      const creditUsed = await useCredit(newApp.id);
      
      if (!creditUsed) {
        toast.error("Failed to use payment credit");
        await supabase.from("visa_applications").delete().eq("id", newApp.id);
        return;
      }

      setApplicationData({
        ...defaultData,
        id: newApp.id,
        email: user.email || "",
      });
      setIsPaid(true);
      toast.success("Payment credit applied! Complete your application.");
      navigate(`/apply-visa?id=${newApp.id}`, { replace: true });
    } catch (error: any) {
      const message = error?.message || error?.details || error?.hint || "Unknown error";
      console.error("Error creating application with credit:", JSON.stringify(error, null, 2));
      toast.error(`Failed to create application: ${message}`);
    } finally {
      setCreatingWithCredit(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for both auth and credits to finish loading
    if (!session || !user || creditsLoading) return;
    
    if (applicationIdFromUrl) {
      loadApplicationById(applicationIdFromUrl);
    } else if (useCreditFromUrl && availableCredits > 0 && !hasTriedCreditCreation.current) {
      // Use credit to create new application - only try once
      hasTriedCreditCreation.current = true;
      createApplicationWithCredit();
    } else if (useCreditFromUrl && availableCredits === 0 && !creditsLoading) {
      // User requested credit use but has no credits
      toast.error("No payment credits available. Please make a payment first.");
      navigate("/book-visa");
    } else if (!useCreditFromUrl) {
      loadDraftApplication();
    }
  }, [session, user, applicationIdFromUrl, useCreditFromUrl, availableCredits, creditsLoading]);

  const loadDocumentsStatus = async (appId: string) => {
    try {
      const { data: docs } = await supabase
        .from("application_documents")
        .select("document_type")
        .eq("application_id", appId);

      if (docs) {
        const hasPhoto = docs.some(d => d.document_type === "photo");
        const hasPassport = docs.some(d => d.document_type === "passport");
        setDocumentsUploaded({ photo: hasPhoto, passport: hasPassport });
      }
    } catch (error) {
      console.error("Error loading documents status:", error);
    }
  };

  const loadApplicationById = async (id: string) => {
    setLoading(true);
    try {
      const { data: appData, error: appError } = await supabase
        .from("visa_applications")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (appError) throw appError;

      if (appData) {
        const defaultData = getDefaultApplicationData(user?.email);
        setApplicationData({
          ...defaultData,
          ...appData,
          id: appData.id,
          countries_visited_last_10_years: appData.countries_visited_last_10_years || [],
        });

        setIsSubmitted(appData.status === "submitted" || appData.status === "in_review" || appData.status === "completed" || appData.status === "rejected");
        await loadDocumentsStatus(id);

        const { data: paymentData } = await supabase
          .from("payments")
          .select("*")
          .eq("application_id", id)
          .eq("status", "completed")
          .maybeSingle();

        setIsPaid(!!paymentData);
      }
    } catch (error: any) {
      console.error("Error loading application:", error);
      toast.error("Application not found");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadDraftApplication = async () => {
    setLoading(true);
    try {
      // First check if user has any draft applications they can continue
      const { data: draftData, error: draftError } = await supabase
        .from("visa_applications")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (draftError) throw draftError;

      if (draftData) {
        // Found a draft, load it
        const defaultData = getDefaultApplicationData(user?.email);
        setApplicationData({
          ...defaultData,
          ...draftData,
          id: draftData.id,
          countries_visited_last_10_years: draftData.countries_visited_last_10_years || [],
        });

        setIsSubmitted(false);
        await loadDocumentsStatus(draftData.id);

        const { data: paymentData } = await supabase
          .from("payments")
          .select("*")
          .eq("application_id", draftData.id)
          .eq("status", "completed")
          .maybeSingle();

        setIsPaid(!!paymentData);
      } else if (availableCredits > 0) {
        // No draft but has credits - prompt to use credits
        toast.info("You have payment credits available. Use them to start a new application.");
        navigate("/dashboard");
      } else {
        // No draft and no credits - need to book first
        toast.info("Please book a visa package first");
        navigate("/book-visa");
      }
    } catch (error: any) {
      console.error("Error loading draft:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveApplication = async (showToast: boolean = false) => {
    if (!user || saving || !applicationData.surname) return false;

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('visa-application-save', {
        body: {
          id: applicationData.id,
          // Applicant Details
          surname: applicationData.surname || "",
          given_name: applicationData.given_name || "",
          full_name: `${applicationData.surname || ""} ${applicationData.given_name || ""}`.trim(),
          changed_name: applicationData.changed_name || false,
          changed_name_details: applicationData.changed_name_details || null,
          date_of_birth: applicationData.date_of_birth || null,
          gender: applicationData.gender || "male",
          place_of_birth: applicationData.place_of_birth || "",
          country_of_birth: applicationData.country_of_birth || "",
          citizenship_id: applicationData.citizenship_id || "",
          religion: applicationData.religion || "",
          visible_identification_marks: applicationData.visible_identification_marks || "",
          educational_qualification: applicationData.educational_qualification || "",
          nationality: applicationData.nationality || "",
          nationality_by_birth: applicationData.nationality_by_birth ?? true,
          lived_in_applying_country_2_years: applicationData.lived_in_applying_country_2_years ?? true,
          // Passport Details
          passport_number: applicationData.passport_number || "",
          passport_place_of_issue: applicationData.passport_place_of_issue || "",
          passport_issue_date: applicationData.passport_issue_date || null,
          passport_expiry_date: applicationData.passport_expiry_date || null,
          other_passport_held: applicationData.other_passport_held || false,
          other_passport_country: applicationData.other_passport_country || null,
          other_passport_number: applicationData.other_passport_number || null,
          other_passport_issue_date: applicationData.other_passport_issue_date || null,
          other_passport_place_of_issue: applicationData.other_passport_place_of_issue || null,
          other_passport_nationality: applicationData.other_passport_nationality || null,
          // Contact & Address
          email: applicationData.email || user.email || "",
          mobile_isd: applicationData.mobile_isd || "+971",
          mobile_number: applicationData.mobile_number || "",
          present_address_house_street: applicationData.present_address_house_street || "",
          present_address_village_town: applicationData.present_address_village_town || "",
          present_address_state: applicationData.present_address_state || "",
          present_address_postal_code: applicationData.present_address_postal_code || "",
          present_address_country: applicationData.present_address_country || "",
          present_address_phone: applicationData.present_address_phone || null,
          permanent_address_same_as_present: applicationData.permanent_address_same_as_present ?? true,
          permanent_address_house_street: applicationData.permanent_address_house_street || null,
          permanent_address_village_town: applicationData.permanent_address_village_town || null,
          permanent_address_state: applicationData.permanent_address_state || null,
          // Legacy fields
          residential_address: applicationData.present_address_house_street || "",
          city: applicationData.present_address_village_town || "",
          country: applicationData.present_address_country || "",
          // Family Details
          father_name: applicationData.father_name || "",
          father_nationality: applicationData.father_nationality || "",
          father_prev_nationality: applicationData.father_prev_nationality || null,
          father_place_of_birth: applicationData.father_place_of_birth || "",
          father_country_of_birth: applicationData.father_country_of_birth || "",
          mother_name: applicationData.mother_name || "",
          mother_nationality: applicationData.mother_nationality || "",
          mother_prev_nationality: applicationData.mother_prev_nationality || null,
          mother_place_of_birth: applicationData.mother_place_of_birth || "",
          mother_country_of_birth: applicationData.mother_country_of_birth || "",
          marital_status: applicationData.marital_status || "Single",
          spouse_name: applicationData.spouse_name || null,
          spouse_nationality: applicationData.spouse_nationality || null,
          spouse_prev_nationality: applicationData.spouse_prev_nationality || null,
          spouse_place_of_birth: applicationData.spouse_place_of_birth || null,
          spouse_country_of_birth: applicationData.spouse_country_of_birth || null,
          pakistan_heritage: applicationData.pakistan_heritage || false,
          pakistan_heritage_details: applicationData.pakistan_heritage_details || null,
          // Visa Details
          visa_type: applicationData.visa_type || "tourist",
          visa_type_other: applicationData.visa_type_other || null,
          duration_of_stay: applicationData.duration_of_stay || "30 days",
          intended_arrival_date: applicationData.intended_arrival_date || null,
          arrival_point_id: applicationData.arrival_point_id || null,
          expected_port_of_exit: applicationData.expected_port_of_exit || null,
          purpose_of_visit: applicationData.purpose_of_visit || null,
          places_to_visit_1: applicationData.places_to_visit_1 || null,
          places_to_visit_2: applicationData.places_to_visit_2 || null,
          hotel_booked_through_operator: applicationData.hotel_booked_through_operator || false,
          hotel_name: applicationData.hotel_name || null,
          hotel_address: applicationData.hotel_address || null,
          // Previous Visa
          visited_india_before: applicationData.visited_india_before || false,
          previous_india_address: applicationData.previous_india_address || null,
          previous_india_cities: applicationData.previous_india_cities || null,
          previous_visa_number: applicationData.previous_visa_number || null,
          previous_visa_type: applicationData.previous_visa_type || null,
          previous_visa_place_of_issue: applicationData.previous_visa_place_of_issue || null,
          previous_visa_issue_date: applicationData.previous_visa_issue_date || null,
          permission_refused_before: applicationData.permission_refused_before || false,
          permission_refused_details: applicationData.permission_refused_details || null,
          // Legacy fields
          indian_contact_address: applicationData.reference_india_address || applicationData.indian_contact_address || "",
          indian_contact_person: applicationData.reference_india_name || applicationData.indian_contact_person || null,
          indian_contact_phone: applicationData.reference_india_phone || applicationData.indian_contact_phone || null,
          previous_visa_details: applicationData.previous_visa_details || null,
          visa_refused_before: applicationData.permission_refused_before || false,
          visa_refusal_details: applicationData.permission_refused_details || null,
          // Other Info
          countries_visited_last_10_years: applicationData.countries_visited_last_10_years || [],
          visited_saarc_countries: applicationData.visited_saarc_countries || false,
          saarc_countries_details: applicationData.saarc_countries_details || null,
          // References
          reference_india_name: applicationData.reference_india_name || "",
          reference_india_address: applicationData.reference_india_address || "",
          reference_india_phone: applicationData.reference_india_phone || "",
          reference_home_name: applicationData.reference_home_name || "",
          reference_home_address: applicationData.reference_home_address || "",
          reference_home_phone: applicationData.reference_home_phone || "",
          // Security Questions
          security_arrested_convicted: applicationData.security_arrested_convicted || false,
          security_arrested_details: applicationData.security_arrested_details || null,
          security_refused_entry_deported: applicationData.security_refused_entry_deported || false,
          security_refused_entry_details: applicationData.security_refused_entry_details || null,
          security_criminal_activities: applicationData.security_criminal_activities || false,
          security_criminal_details: applicationData.security_criminal_details || null,
          security_terrorist_activities: applicationData.security_terrorist_activities || false,
          security_terrorist_details: applicationData.security_terrorist_details || null,
          security_terrorist_views: applicationData.security_terrorist_views || false,
          security_terrorist_views_details: applicationData.security_terrorist_views_details || null,
          security_asylum_sought: applicationData.security_asylum_sought || false,
          security_asylum_details: applicationData.security_asylum_details || null,
          // Declaration
          declaration_accepted: applicationData.declaration_accepted || false,
        },
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.data?.id && !applicationData.id) {
        setApplicationData({ ...applicationData, id: data.data.id });
      }

      if (showToast) {
        toast.success("Saved successfully");
      }

      setLastSaved(new Date());
      return true;
    } catch (error: any) {
      console.error("Save failed:", error);
      if (showToast) toast.error("Failed to save application");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    return await saveApplication(true);
  };

  const handleSaveAndExit = async () => {
    const saved = await saveApplication(false);
    if (saved) {
      toast.success("Application saved to drafts");
      navigate("/dashboard");
    }
  };

  const handleSubmitApplication = async () => {
    if (!applicationData.id || isSubmitted) return;

    if (!isFormComplete()) {
      toast.error("Please complete all required fields, upload documents, and accept the declaration");
      return;
    }

    // Business rule validation: Check applicant eligibility
    const eligibility = validateApplicantEligibility({
      nationality: applicationData.nationality,
      nationality_by_birth: applicationData.nationality_by_birth,
      passport_place_of_issue: applicationData.passport_place_of_issue,
      country_of_birth: applicationData.country_of_birth,
    });

    if (!eligibility.eligible) {
      toast.error(eligibility.error || "You are not eligible to apply for this visa.");
      return;
    }

    setSubmitting(true);
    try {
      const saved = await saveApplication(false);
      if (!saved) {
        throw new Error("Save failed before submission");
      }

      const { data: submitData, error: submitError } = await supabase.functions.invoke(
        "visa-application-submit",
        {
          body: { applicationId: applicationData.id },
        },
      );

      console.log("Submit response:", { submitData, submitError });

      if (submitError) throw submitError;
      if ((submitData as any)?.error) throw new Error((submitData as any).error);

      // Mark submitted (Step 9/9 completion)
      setIsSubmitted(true);
      setApplicationData((prev) => ({ ...prev, status: "submitted" }));

      // Send external confirmation email (non-blocking, runs once on final submission)
      try {
        console.log("CONFIRM EMAIL TRIGGERED");

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const accessToken = session?.access_token;

        await fetch(`${supabaseUrl}/functions/v1/send-confirmation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            email: applicationData.email,
            name:
              applicationData.full_name ||
              `${applicationData.surname || ""} ${applicationData.given_name || ""}`.trim(),
          }),
        });
      } catch (confirmError) {
        console.error("External confirmation API error:", confirmError);
        // Don't block submission if this fails
      }

      // Send internal email notifications (non-blocking)
      try {
        await supabase.functions.invoke("send-visa-submission-admin", {
          body: { applicationId: applicationData.id },
        });
        await supabase.functions.invoke("send-visa-submission-user", {
          body: { applicationId: applicationData.id },
        });
      } catch (emailError) {
        console.error("Email notification error:", emailError);
      }

      toast.success(
        "Your visa application has been submitted successfully. A confirmation email has been sent to your email address.",
      );
    } catch (error: any) {
      const message = error?.message || error?.details || error?.hint || "Unknown error";
      console.error("Submit error:", error);
      toast.error(`Failed to submit application: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const updateData = (updates: Partial<ApplicationData>) => {
    if (isSubmitted) return;
    setApplicationData({ ...applicationData, ...updates });
  };

  const goToNextTab = async () => {
    await handleSaveAndContinue();
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1].value);
    }
  };

  const goToPreviousTab = async () => {
    if (applicationData.id && !isSubmitted) {
      await saveApplication(false);
    }
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].value);
    }
  };

  const handleDocumentUploaded = (type: "photo" | "passport", uploaded: boolean) => {
    setDocumentsUploaded(prev => ({ ...prev, [type]: uploaded }));
  };

  if (authLoading || creatingWithCredit) return null;

  if (!session) return null;
  if (!user) return null;

  if (!isPaid && !applicationIdFromUrl && availableCredits === 0) {
    return (
      <div className="py-12">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Complete Your Booking First</h1>
          <p className="text-muted-foreground mb-8">
            Please select a visa package and complete payment before filling out your application.
          </p>
          <Button onClick={() => navigate("/book-visa")} size="lg">
            Book Visa Package
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 md:py-12">
      <div className="container max-w-4xl mx-auto px-4">
          {isSubmitted && (
            <Alert className="mb-6 bg-primary/10 border-primary">
              <Lock className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <span className="font-semibold">Your application has been submitted and is being reviewed.</span>
                <span className="block text-sm text-muted-foreground mt-1">
                  This form is now read-only. Our team will contact you if additional information is needed.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {isPaid && !isSubmitted && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 dark:text-green-200">Payment confirmed. Please complete your application details.</span>
            </div>
          )}

          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Visa Application
                  {applicationData.surname && (
                    <span className="text-primary"> — {applicationData.surname} {applicationData.given_name}</span>
                  )}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isSubmitted 
                    ? "Your application is under review" 
                    : "Fill in all required details to submit your visa application"}
                </p>
              </div>
              {!isSubmitted && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSaveAndExit}
                    disabled={saving}
                    className="hidden sm:flex"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Save & Exit
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="h-3 transition-all duration-500" />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Step {currentTabIndex + 1} of {tabs.length}</span>
                <SaveIndicator saving={saving} lastSaved={lastSaved} />
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-9 mb-6 md:mb-8 h-auto overflow-x-auto">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className="text-[10px] md:text-xs py-2 px-1"
                  disabled={isSubmitted}
                >
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="applicant">
              <ApplicantDetailsTab 
                data={applicationData} 
                updateData={updateData} 
                onNext={goToNextTab}
                disabled={isSubmitted}
              />
            </TabsContent>

            <TabsContent value="passport">
              <PassportDetailsTab 
                data={applicationData} 
                updateData={updateData} 
                onNext={goToNextTab} 
                onBack={goToPreviousTab}
                disabled={isSubmitted}
              />
            </TabsContent>

            <TabsContent value="address">
              <AddressDetailsTab 
                data={applicationData} 
                updateData={updateData} 
                onNext={goToNextTab} 
                onBack={goToPreviousTab}
                disabled={isSubmitted}
              />
            </TabsContent>

            <TabsContent value="family">
              <FamilyDetailsTab 
                data={applicationData} 
                updateData={updateData} 
                onNext={goToNextTab} 
                onBack={goToPreviousTab}
                disabled={isSubmitted}
              />
            </TabsContent>

            <TabsContent value="visa">
              <VisaDetailsTabNew 
                data={applicationData} 
                updateData={updateData} 
                onNext={goToNextTab} 
                onBack={goToPreviousTab}
                disabled={isSubmitted}
              />
            </TabsContent>

            <TabsContent value="previous">
              <PreviousVisaTab 
                data={applicationData} 
                updateData={updateData} 
                onNext={goToNextTab} 
                onBack={goToPreviousTab}
                disabled={isSubmitted}
              />
            </TabsContent>

            <TabsContent value="references">
              <ReferencesTab 
                data={applicationData} 
                updateData={updateData} 
                onNext={goToNextTab} 
                onBack={goToPreviousTab}
                disabled={isSubmitted}
              />
            </TabsContent>

            <TabsContent value="security">
              <SecurityQuestionsTab 
                data={applicationData} 
                updateData={updateData} 
                onNext={goToNextTab} 
                onBack={goToPreviousTab}
                disabled={isSubmitted}
              />
            </TabsContent>

            <TabsContent value="uploads">
              <UploadsTab 
                applicationId={applicationData.id} 
                onNext={handleSubmitApplication} 
                onBack={goToPreviousTab}
                isLastStep={true}
                submitting={submitting}
                disabled={isSubmitted}
                isFormComplete={isFormComplete()}
                missingItems={getMissingItems()}
                onDocumentUploaded={handleDocumentUploaded}
                declarationAccepted={applicationData.declaration_accepted}
                onDeclarationChange={(accepted) => updateData({ declaration_accepted: accepted })}
              />
            </TabsContent>
          </Tabs>

          {!isSubmitted && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t sm:hidden z-50">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSaveAndExit}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save & Exit
              </Button>
            </div>
          )}
      </div>
    </div>
  );
};

export default ApplyVisa;

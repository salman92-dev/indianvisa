import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, 
  Copy, 
  FileText, 
  FileSpreadsheet, 
  Image, 
  Loader2,
  CreditCard,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { exportSingleSheet } from "@/lib/excelExport";
import jsPDF from "jspdf";

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  mime_type?: string;
}

interface Application {
  id: string;
  user_id: string;
  full_name: string;
  surname: string | null;
  given_name: string | null;
  email: string;
  nationality: string;
  passport_number: string;
  passport_issue_date: string;
  passport_expiry_date: string;
  passport_place_of_issue: string | null;
  visa_type: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  date_of_birth: string;
  gender: string;
  mobile_number: string;
  mobile_isd: string;
  intended_arrival_date: string;
  duration_of_stay: string;
  place_of_birth: string;
  country_of_birth: string;
  residential_address: string;
  city: string;
  country: string;
  religion: string | null;
  marital_status: string | null;
  educational_qualification: string | null;
  visible_identification_marks: string | null;
  father_name: string | null;
  father_nationality: string | null;
  father_prev_nationality: string | null;
  father_place_of_birth: string | null;
  father_country_of_birth: string | null;
  mother_name: string | null;
  mother_nationality: string | null;
  mother_prev_nationality: string | null;
  mother_place_of_birth: string | null;
  mother_country_of_birth: string | null;
  spouse_name: string | null;
  spouse_nationality: string | null;
  spouse_prev_nationality: string | null;
  spouse_place_of_birth: string | null;
  spouse_country_of_birth: string | null;
  indian_contact_address: string;
  indian_contact_person: string | null;
  indian_contact_phone: string | null;
  reference_india_name: string | null;
  reference_india_address: string | null;
  reference_india_phone: string | null;
  reference_home_name: string | null;
  reference_home_address: string | null;
  reference_home_phone: string | null;
  visited_india_before: boolean | null;
  previous_visa_number: string | null;
  previous_visa_type: string | null;
  previous_visa_place_of_issue: string | null;
  previous_visa_issue_date: string | null;
  previous_india_address: string | null;
  previous_india_cities: string | null;
  countries_visited_last_10_years: string[] | null;
  is_locked: boolean | null;
  declaration_accepted: boolean | null;
  // Additional fields
  changed_name: boolean | null;
  changed_name_details: string | null;
  citizenship_id: string | null;
  nationality_by_birth: boolean | null;
  lived_in_applying_country_2_years: boolean | null;
  other_passport_held: boolean | null;
  other_passport_country: string | null;
  other_passport_number: string | null;
  other_passport_issue_date: string | null;
  other_passport_place_of_issue: string | null;
  other_passport_nationality: string | null;
  present_address_house_street: string | null;
  present_address_village_town: string | null;
  present_address_state: string | null;
  present_address_postal_code: string | null;
  present_address_country: string | null;
  present_address_phone: string | null;
  permanent_address_same_as_present: boolean | null;
  permanent_address_house_street: string | null;
  permanent_address_village_town: string | null;
  permanent_address_state: string | null;
  pakistan_heritage: boolean | null;
  pakistan_heritage_details: string | null;
  purpose_of_visit: string | null;
  places_to_visit_1: string | null;
  places_to_visit_2: string | null;
  hotel_booked_through_operator: boolean | null;
  hotel_name: string | null;
  hotel_address: string | null;
  expected_port_of_exit: string | null;
  arrival_point_id: string | null;
  permission_refused_before: boolean | null;
  permission_refused_details: string | null;
  visited_saarc_countries: boolean | null;
  saarc_countries_details: string | null;
  security_arrested_convicted: boolean | null;
  security_arrested_details: string | null;
  security_refused_entry_deported: boolean | null;
  security_refused_entry_details: string | null;
  security_criminal_activities: boolean | null;
  security_criminal_details: string | null;
  security_terrorist_activities: boolean | null;
  security_terrorist_details: string | null;
  security_terrorist_views: boolean | null;
  security_terrorist_views_details: string | null;
  security_asylum_sought: boolean | null;
  security_asylum_details: string | null;
}

interface PaymentInfo {
  id: string;
  paypal_order_id: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  captured_at: string | null;
  payer_email: string | null;
  payer_name: string | null;
}

interface SnapshotInfo {
  id: string;
  submitted_at: string;
  booking_id: string | null;
  payment_id: string | null;
}

interface AuditEvent {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  changes: any;
}

const VISA_TYPE_LABELS: Record<string, string> = {
  tourist: "Tourist Visa",
  business: "Business Visa",
  medical: "Medical Visa",
  conference: "Conference Visa",
  student: "Student Visa",
  other: "Other",
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  photo: "Passport Photo",
  passport: "Passport Scan",
  business_card: "Business Card",
  invitation_letter: "Invitation Letter",
  hospital_letter: "Hospital Letter",
  conference_docs: "Conference Documents",
  other: "Other Document",
};

interface Props {
  application: Application;
  onClose: () => void;
}

export const ApplicationDetailView = ({ application, onClose }: Props) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [snapshot, setSnapshot] = useState<SnapshotInfo | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [arrivalPointName, setArrivalPointName] = useState<string | null>(null);
  const [exitPointName, setExitPointName] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, [application.id]);

  const loadAllData = async () => {
    await Promise.all([
      loadDocuments(),
      loadMetadata(),
      loadAuditEvents(),
      loadArrivalPoints()
    ]);
  };

  const loadArrivalPoints = async () => {
    try {
      // Load arrival point name
      if (application.arrival_point_id) {
        const { data: arrivalData } = await supabase
          .from("arrival_points")
          .select("name, city")
          .eq("id", application.arrival_point_id)
          .maybeSingle();
        if (arrivalData) {
          setArrivalPointName(`${arrivalData.name}${arrivalData.city ? ` (${arrivalData.city})` : ''}`);
        }
      }

      // Load expected exit point name
      if (application.expected_port_of_exit) {
        const { data: exitData } = await supabase
          .from("arrival_points")
          .select("name, city")
          .eq("id", application.expected_port_of_exit)
          .maybeSingle();
        if (exitData) {
          setExitPointName(`${exitData.name}${exitData.city ? ` (${exitData.city})` : ''}`);
        }
      }
    } catch (error) {
      console.error("Error loading arrival points:", error);
    }
  };

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from("application_documents")
        .select("*")
        .eq("application_id", application.id);

      if (error) throw error;
      setDocuments(data || []);

      const urls: Record<string, string> = {};
      for (const doc of data || []) {
        const { data: signedUrlData } = await supabase.storage
          .from("visa-documents")
          .createSignedUrl(doc.file_path, 3600);
        if (signedUrlData?.signedUrl) {
          urls[doc.id] = signedUrlData.signedUrl;
        }
      }
      setDocumentUrls(urls);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadMetadata = async () => {
    setLoadingMeta(true);
    try {
      // Load payment linked to this application
      const { data: paymentData } = await supabase
        .from("payments")
        .select("*")
        .eq("application_id", application.id)
        .maybeSingle();
      
      if (paymentData) {
        setPayment(paymentData);
      }

      // Load snapshot
      const { data: snapshotData } = await supabase
        .from("application_snapshots")
        .select("id, submitted_at, booking_id, payment_id")
        .eq("application_id", application.id)
        .maybeSingle();
      
      if (snapshotData) {
        setSnapshot(snapshotData);
      }
    } catch (error) {
      console.error("Error loading metadata:", error);
    } finally {
      setLoadingMeta(false);
    }
  };

  const loadAuditEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_id", application.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setAuditEvents(data || []);
    } catch (error) {
      console.error("Error loading audit events:", error);
    }
  };

  // Indian eVisa form field order - exactly matching official form
  const getFormattedFields = () => {
    const app = application;
    return [
      // Section 1: Applicant Details
      { section: "APPLICANT DETAILS", fields: [
        { label: "Surname (exactly as in passport)", value: app.surname || "—" },
        { label: "Given Name(s) (exactly as in passport)", value: app.given_name || "—" },
        { label: "Have you ever changed your name?", value: app.changed_name ? "Yes" : "No" },
        { label: "Changed Name Details", value: app.changed_name_details || "—", hidden: !app.changed_name },
        { label: "Date of Birth", value: app.date_of_birth },
        { label: "Town/City of Birth", value: app.place_of_birth },
        { label: "Country of Birth", value: app.country_of_birth },
        { label: "Citizenship/National ID No.", value: app.citizenship_id || "—" },
        { label: "Religion", value: app.religion || "—" },
        { label: "Visible Identification Marks (exactly as in passport, if any)", value: app.visible_identification_marks || "—" },
        { label: "Educational Qualification", value: app.educational_qualification || "—" },
        { label: "Nationality", value: app.nationality },
        { label: "Nationality by Birth or Naturalization", value: app.nationality_by_birth ? "Birth" : "Naturalization" },
        { label: "Lived in applying country 2+ years", value: app.lived_in_applying_country_2_years ? "Yes" : "No" },
        { label: "Gender", value: app.gender },
        { label: "Marital Status", value: app.marital_status || "—" },
      ]},
      // Section 2: Passport Details
      { section: "PASSPORT DETAILS", fields: [
        { label: "Passport Number", value: app.passport_number },
        { label: "Place of Issue", value: app.passport_place_of_issue || "—" },
        { label: "Date of Issue", value: app.passport_issue_date },
        { label: "Date of Expiry", value: app.passport_expiry_date },
        { label: "Any other Passport/IC held", value: app.other_passport_held ? "Yes" : "No" },
        { label: "Other Passport Country", value: app.other_passport_country || "—", hidden: !app.other_passport_held },
        { label: "Other Passport Number", value: app.other_passport_number || "—", hidden: !app.other_passport_held },
        { label: "Other Passport Issue Date", value: app.other_passport_issue_date || "—", hidden: !app.other_passport_held },
        { label: "Other Passport Place of Issue", value: app.other_passport_place_of_issue || "—", hidden: !app.other_passport_held },
        { label: "Other Passport Nationality", value: app.other_passport_nationality || "—", hidden: !app.other_passport_held },
      ]},
      // Section 3: Applicant's Address Details
      { section: "PRESENT ADDRESS", fields: [
        { label: "House No./Street", value: app.present_address_house_street || app.residential_address || "—" },
        { label: "Village/Town/City", value: app.present_address_village_town || app.city || "—" },
        { label: "State/Province", value: app.present_address_state || "—" },
        { label: "Postal/Zip Code", value: app.present_address_postal_code || "—" },
        { label: "Country", value: app.present_address_country || app.country || "—" },
        { label: "Phone No.", value: app.present_address_phone || `${app.mobile_isd} ${app.mobile_number}` },
        { label: "Email Address", value: app.email },
      ]},
      // Permanent Address
      { section: "PERMANENT ADDRESS", fields: [
        { label: "Same as Present Address", value: app.permanent_address_same_as_present ? "Yes" : "No" },
        { label: "House No./Street", value: app.permanent_address_house_street || "—", hidden: app.permanent_address_same_as_present },
        { label: "Village/Town/City", value: app.permanent_address_village_town || "—", hidden: app.permanent_address_same_as_present },
        { label: "State/Province", value: app.permanent_address_state || "—", hidden: app.permanent_address_same_as_present },
      ]},
      // Section 4: Family Details
      { section: "FAMILY DETAILS - FATHER", fields: [
        { label: "Father's Name", value: app.father_name || "—" },
        { label: "Father's Nationality", value: app.father_nationality || "—" },
        { label: "Father's Previous Nationality", value: app.father_prev_nationality || "—" },
        { label: "Father's Place of Birth", value: app.father_place_of_birth || "—" },
        { label: "Father's Country of Birth", value: app.father_country_of_birth || "—" },
      ]},
      { section: "FAMILY DETAILS - MOTHER", fields: [
        { label: "Mother's Name", value: app.mother_name || "—" },
        { label: "Mother's Nationality", value: app.mother_nationality || "—" },
        { label: "Mother's Previous Nationality", value: app.mother_prev_nationality || "—" },
        { label: "Mother's Place of Birth", value: app.mother_place_of_birth || "—" },
        { label: "Mother's Country of Birth", value: app.mother_country_of_birth || "—" },
      ]},
      { section: "FAMILY DETAILS - SPOUSE", fields: [
        { label: "Spouse's Name", value: app.spouse_name || "—" },
        { label: "Spouse's Nationality", value: app.spouse_nationality || "—" },
        { label: "Spouse's Previous Nationality", value: app.spouse_prev_nationality || "—" },
        { label: "Spouse's Place of Birth", value: app.spouse_place_of_birth || "—" },
        { label: "Spouse's Country of Birth", value: app.spouse_country_of_birth || "—" },
      ]},
      // Pakistan Heritage
      { section: "PAKISTAN HERITAGE", fields: [
        { label: "Pakistan Heritage?", value: app.pakistan_heritage ? "Yes" : "No" },
        { label: "Details", value: app.pakistan_heritage_details || "—", hidden: !app.pakistan_heritage },
      ]},
      // Section 5: Details of Visa Sought
      { section: "DETAILS OF VISA SOUGHT", fields: [
        { label: "Type of Visa", value: VISA_TYPE_LABELS[app.visa_type] || app.visa_type },
        { label: "Purpose of Visit", value: app.purpose_of_visit || "—" },
        { label: "Expected Date of Arrival", value: app.intended_arrival_date },
        { label: "Port of Arrival", value: arrivalPointName || app.arrival_point_id || "—" },
        { label: "Duration of Stay", value: app.duration_of_stay },
        { label: "Expected Port of Exit", value: exitPointName || app.expected_port_of_exit || "—" },
        { label: "Places to Visit (1)", value: app.places_to_visit_1 || "—" },
        { label: "Places to Visit (2)", value: app.places_to_visit_2 || "—" },
      ]},
      // Hotel/Accommodation
      { section: "ACCOMMODATION DETAILS", fields: [
        { label: "Hotel Booked Through Operator", value: app.hotel_booked_through_operator ? "Yes" : "No" },
        { label: "Hotel Name", value: app.hotel_name || "—" },
        { label: "Hotel Address", value: app.hotel_address || "—" },
      ]},
      // Section 6: Reference in India
      { section: "REFERENCE IN INDIA", fields: [
        { label: "Reference Name", value: app.reference_india_name || app.indian_contact_person || "—" },
        { label: "Address", value: app.reference_india_address || app.indian_contact_address },
        { label: "Phone", value: app.reference_india_phone || app.indian_contact_phone || "—" },
      ]},
      // Section 7: Reference in Home Country
      { section: "REFERENCE IN HOME COUNTRY", fields: [
        { label: "Reference Name", value: app.reference_home_name || "—" },
        { label: "Address", value: app.reference_home_address || "—" },
        { label: "Phone", value: app.reference_home_phone || "—" },
      ]},
      // Section 8: Previous Visa/Visit Details
      { section: "PREVIOUS VISA/VISIT DETAILS", fields: [
        { label: "Have you ever visited India before?", value: app.visited_india_before ? "Yes" : "No" },
        { label: "Previous Visa Number", value: app.previous_visa_number || "—", hidden: !app.visited_india_before },
        { label: "Type of Visa", value: app.previous_visa_type || "—", hidden: !app.visited_india_before },
        { label: "Place of Issue", value: app.previous_visa_place_of_issue || "—", hidden: !app.visited_india_before },
        { label: "Date of Issue", value: app.previous_visa_issue_date || "—", hidden: !app.visited_india_before },
        { label: "Address in India", value: app.previous_india_address || "—", hidden: !app.visited_india_before },
        { label: "Cities Visited", value: app.previous_india_cities || "—", hidden: !app.visited_india_before },
        { label: "Permission Ever Refused?", value: app.permission_refused_before ? "Yes" : "No" },
        { label: "Refusal Details", value: app.permission_refused_details || "—", hidden: !app.permission_refused_before },
        { label: "Countries Visited (Last 10 Years)", value: (app.countries_visited_last_10_years || []).join(", ") || "—" },
        { label: "Visited SAARC Countries?", value: app.visited_saarc_countries ? "Yes" : "No" },
        { label: "SAARC Countries Details", value: app.saarc_countries_details || "—", hidden: !app.visited_saarc_countries },
      ]},
      // Section 9: Security Questions
      { section: "SECURITY QUESTIONS", fields: [
        { label: "Ever arrested/convicted?", value: app.security_arrested_convicted ? "Yes" : "No" },
        { label: "Arrest/Conviction Details", value: app.security_arrested_details || "—", hidden: !app.security_arrested_convicted },
        { label: "Ever refused entry/deported?", value: app.security_refused_entry_deported ? "Yes" : "No" },
        { label: "Refusal/Deportation Details", value: app.security_refused_entry_details || "—", hidden: !app.security_refused_entry_deported },
        { label: "Engaged in criminal activities?", value: app.security_criminal_activities ? "Yes" : "No" },
        { label: "Criminal Activities Details", value: app.security_criminal_details || "—", hidden: !app.security_criminal_activities },
        { label: "Engaged in terrorist activities?", value: app.security_terrorist_activities ? "Yes" : "No" },
        { label: "Terrorist Activities Details", value: app.security_terrorist_details || "—", hidden: !app.security_terrorist_activities },
        { label: "Expressed views supporting terrorism?", value: app.security_terrorist_views ? "Yes" : "No" },
        { label: "Terrorism Views Details", value: app.security_terrorist_views_details || "—", hidden: !app.security_terrorist_views },
        { label: "Ever sought asylum?", value: app.security_asylum_sought ? "Yes" : "No" },
        { label: "Asylum Details", value: app.security_asylum_details || "—", hidden: !app.security_asylum_sought },
      ]},
    ];
  };

  const copyAllFields = () => {
    const sections = getFormattedFields();
    let text = `INDIA eVISA APPLICATION - ${application.full_name}\n`;
    text += `Application ID: ${application.id}\n`;
    text += `Status: ${application.status.toUpperCase()}\n`;
    text += `Submitted: ${application.submitted_at ? new Date(application.submitted_at).toLocaleString() : "Not submitted"}\n\n`;

    sections.forEach(section => {
      text += `\n=== ${section.section} ===\n`;
      section.fields.forEach(field => {
        text += `${field.label}: ${field.value}\n`;
      });
    });

    text += `\n=== DECLARATION ===\n`;
    text += `Declaration Accepted: ${application.declaration_accepted ? "Yes" : "No"}\n`;

    navigator.clipboard.writeText(text);
    toast.success("All fields copied to clipboard");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const sections = getFormattedFields();
    let y = 20;
    const lineHeight = 6;
    const pageHeight = 280;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INDIA eVISA APPLICATION", 105, y, { align: "center" });
    y += 10;

    // Applicant name
    doc.setFontSize(12);
    doc.text(application.full_name, 105, y, { align: "center" });
    y += 8;

    // Meta info
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Application ID: ${application.id}`, 20, y);
    y += 5;
    doc.text(`Status: ${application.status.toUpperCase()}`, 20, y);
    y += 5;
    doc.text(`Submitted: ${application.submitted_at ? new Date(application.submitted_at).toLocaleString() : "Not submitted"}`, 20, y);
    y += 10;

    sections.forEach(section => {
      // Check if we need a new page
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      // Section header
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(240, 240, 240);
      doc.rect(15, y - 4, 180, 8, "F");
      doc.text(section.section, 20, y);
      y += 10;

      // Fields
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      section.fields.forEach(field => {
        if (y > pageHeight) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text(`${field.label}:`, 20, y);
        doc.setFont("helvetica", "normal");
        const valueX = 85;
        const maxWidth = 110;
        const lines = doc.splitTextToSize(String(field.value), maxWidth);
        doc.text(lines, valueX, y);
        y += lineHeight * Math.max(lines.length, 1);
      });
      y += 5;
    });

    // Declaration
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text("DECLARATION", 20, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Declaration Accepted: ${application.declaration_accepted ? "Yes" : "No"}`, 20, y);

    doc.save(`visa-application-${application.full_name.replace(/\s+/g, "-")}.pdf`);
    toast.success("PDF exported");
  };

  const exportExcel = async () => {
    const sections = getFormattedFields();
    
    const data: { Field: string; Value: string }[] = [];
    data.push({ Field: "Application ID", Value: application.id });
    data.push({ Field: "Status", Value: application.status });
    data.push({ Field: "Submitted At", Value: application.submitted_at || "Not submitted" });
    data.push({ Field: "", Value: "" });

    sections.forEach(section => {
      data.push({ Field: `=== ${section.section} ===`, Value: "" });
      section.fields.forEach(field => {
        data.push({ Field: field.label, Value: field.value });
      });
      data.push({ Field: "", Value: "" });
    });

    data.push({ Field: "Declaration Accepted", Value: application.declaration_accepted ? "Yes" : "No" });

    try {
      await exportSingleSheet(
        data, 
        "Application", 
        `visa-application-${application.full_name.replace(/\s+/g, "-")}.xlsx`
      );
      toast.success("Excel exported");
    } catch (error) {
      console.error("Excel export failed:", error);
      toast.error("Failed to export Excel file");
    }
  };

  const isImageFile = (mimeType?: string) => mimeType?.startsWith("image/");

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      draft: "bg-gray-500",
      submitted: "bg-blue-500",
      under_review: "bg-yellow-500",
      approved: "bg-emerald-500",
      completed: "bg-green-500",
      rejected: "bg-red-500",
    };
    return (
      <Badge className={config[status] || "bg-gray-500"}>
        {status?.replace("_", " ").charAt(0).toUpperCase() + status?.slice(1).replace("_", " ")}
      </Badge>
    );
  };

  const getAuditIcon = (action: string) => {
    if (action.includes("created") || action.includes("registered")) return <User className="h-4 w-4 text-green-500" />;
    if (action.includes("payment") || action.includes("captured")) return <CreditCard className="h-4 w-4 text-blue-500" />;
    if (action.includes("submitted")) return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (action.includes("rejected") || action.includes("failed")) return <XCircle className="h-4 w-4 text-red-500" />;
    if (action.includes("status")) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const sections = getFormattedFields();

  return (
    <div className="space-y-4">
      {/* Quick Action Bar - Always visible at top */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border">
        <Button onClick={copyAllFields} variant="outline" size="sm">
          <Copy className="h-4 w-4 mr-2" />
          Copy All Fields
        </Button>
        <Button onClick={exportExcel} variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 border-green-200">
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          Export Excel
        </Button>
        <Button onClick={exportPDF} variant="outline" size="sm" className="bg-red-50 hover:bg-red-100 border-red-200">
          <FileText className="h-4 w-4 mr-2 text-red-600" />
          Export PDF
        </Button>
        <div className="flex-1" />
        {getStatusBadge(application.status)}
        {application.is_locked && <Badge variant="secondary">Locked</Badge>}
      </div>

      {/* Metadata Panel - Payment, Booking, Snapshot */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Metadata & Payment Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMeta ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading metadata...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Snapshot ID:</span>
                <p className="font-mono text-xs">{snapshot?.id?.slice(0, 8) || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Submitted At:</span>
                <p>{snapshot?.submitted_at ? new Date(snapshot.submitted_at).toLocaleString() : application.submitted_at ? new Date(application.submitted_at).toLocaleString() : "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Booking ID:</span>
                <p className="font-mono text-xs">{snapshot?.booking_id?.slice(0, 8) || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Payment ID:</span>
                <p className="font-mono text-xs">{snapshot?.payment_id?.slice(0, 8) || payment?.id?.slice(0, 8) || "—"}</p>
              </div>
              {payment && (
                <>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <p className="font-bold text-green-600">{payment.currency} {payment.total_amount}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Status:</span>
                    <Badge variant={payment.status === "completed" ? "default" : "secondary"} className="ml-1">
                      {payment.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PayPal Order:</span>
                    <p className="font-mono text-xs">{payment.paypal_order_id?.slice(0, 12)}...</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payer:</span>
                    <p>{payment.payer_name || payment.payer_email || "—"}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="application" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="application">Application Form</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="timeline">Audit Timeline ({auditEvents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="application">
          <ScrollArea className="h-[50vh]">
            <div className="space-y-6 p-2">
              {sections.map((section, idx) => (
                <div key={idx}>
                  <h4 className="font-semibold text-sm mb-3 text-primary bg-muted/50 p-2 rounded">
                    {section.section}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {section.fields
                      .filter((field: any) => !field.hidden)
                      .map((field: any, fidx: number) => (
                      <div key={fidx}>
                        <span className="text-muted-foreground text-xs">{field.label}:</span>
                        <p className="font-medium">{field.value}</p>
                      </div>
                    ))}
                  </div>
                  {idx < sections.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}

              {/* Declaration */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Declaration Accepted:</strong> {application.declaration_accepted ? "✓ Yes" : "No"}
                </p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="documents">
          <ScrollArea className="h-[50vh]">
            {loadingDocs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No documents uploaded</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isImageFile(doc.mime_type) ? (
                          <Image className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}</p>
                          <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                        </div>
                      </div>
                      {documentUrls[doc.id] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(documentUrls[doc.id], "_blank")}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                    {isImageFile(doc.mime_type) && documentUrls[doc.id] && (
                      <img 
                        src={documentUrls[doc.id]} 
                        alt={doc.file_name}
                        className="max-h-48 rounded-lg border object-contain mx-auto"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="timeline">
          <ScrollArea className="h-[50vh]">
            {auditEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No audit events recorded yet</p>
                <p className="text-xs mt-1">Events will appear here as actions are taken</p>
              </div>
            ) : (
              <div className="relative pl-8 py-2">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
                {auditEvents.map((event, idx) => (
                  <div key={event.id} className="relative mb-4">
                    <div className="absolute -left-5 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                      {getAuditIcon(event.action)}
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 ml-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm capitalize">
                          {event.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {event.entity_type} • {event.changes ? JSON.stringify(event.changes).slice(0, 100) : "No details"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

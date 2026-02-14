import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Loader2, RefreshCw, Eye, FileSpreadsheet, FileDown } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { ApplicationDetailView } from "@/components/admin/ApplicationDetailView";
import { logClientAuditEvent } from "@/components/admin/AuditLogger";
import { toast } from "sonner";
import { exportToExcelFile, exportSingleSheet } from "@/lib/excelExport";

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

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const VISA_TYPE_LABELS: Record<string, string> = {
  tourist: "Tourist Visa",
  business: "Business Visa",
  medical: "Medical Visa",
  conference: "Conference Visa",
  student: "Student Visa",
  other: "Other",
};

const AdminApplications = () => {
  const { isAdmin, loading } = useAdminAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadApplications();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter]);

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("visa_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setDataLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.full_name?.toLowerCase().includes(term) ||
          a.email?.toLowerCase().includes(term) ||
          a.passport_number?.toLowerCase().includes(term) ||
          a.nationality?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    setFilteredApplications(filtered);
  };

  const updateStatus = async (applicationId: string, newStatus: string, app: Application) => {
    try {
      const validStatus = newStatus as "draft" | "submitted" | "under_review" | "approved" | "completed" | "rejected";
      
      const { error } = await supabase
        .from("visa_applications")
        .update({ 
          status: validStatus,
          ...(newStatus === "submitted" ? { submitted_at: new Date().toISOString() } : {}),
          ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {}),
          ...(newStatus === "under_review" || newStatus === "approved" ? { reviewed_at: new Date().toISOString() } : {}),
        })
        .eq("id", applicationId);

      if (error) throw error;

      // Log audit event
      await logClientAuditEvent(
        "application_status_changed",
        "application",
        applicationId,
        { old_status: app.status, new_status: newStatus }
      );

      setApplications(prev => prev.map(a => 
        a.id === applicationId ? { ...a, status: newStatus } : a
      ));

      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.access_token) {
          await supabase.functions.invoke("send-status-update", {
            body: {
              travelerName: app.full_name,
              email: app.email,
              newStatus: newStatus,
              bookingId: applicationId,
            },
          });
        }
      } catch (emailError) {
        console.error("Failed to send status email:", emailError);
      }

      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const exportSingleApplication = async (app: Application) => {
    const applicationData = [
      { Field: "Application ID", Value: app.id },
      { Field: "Status", Value: app.status },
      { Field: "Submitted At", Value: app.submitted_at || "Not submitted" },
      { Field: "Locked", Value: app.is_locked ? "Yes" : "No" },
      { Field: "", Value: "" },
      { Field: "=== APPLICANT DETAILS ===", Value: "" },
      { Field: "Surname", Value: app.surname || "" },
      { Field: "Given Name", Value: app.given_name || "" },
      { Field: "Full Name", Value: app.full_name },
      { Field: "Date of Birth", Value: app.date_of_birth },
      { Field: "Gender", Value: app.gender },
      { Field: "Place of Birth", Value: app.place_of_birth },
      { Field: "Country of Birth", Value: app.country_of_birth },
      { Field: "Nationality", Value: app.nationality },
      { Field: "Religion", Value: app.religion || "" },
      { Field: "Marital Status", Value: app.marital_status || "" },
      { Field: "Educational Qualification", Value: app.educational_qualification || "" },
      { Field: "Visible Identification Marks", Value: app.visible_identification_marks || "" },
      { Field: "", Value: "" },
      { Field: "=== PASSPORT DETAILS ===", Value: "" },
      { Field: "Passport Number", Value: app.passport_number },
      { Field: "Place of Issue", Value: app.passport_place_of_issue || "" },
      { Field: "Date of Issue", Value: app.passport_issue_date },
      { Field: "Date of Expiry", Value: app.passport_expiry_date },
      { Field: "", Value: "" },
      { Field: "=== ADDRESS & CONTACT ===", Value: "" },
      { Field: "Email", Value: app.email },
      { Field: "Mobile", Value: `${app.mobile_isd} ${app.mobile_number}` },
      { Field: "Residential Address", Value: app.residential_address },
      { Field: "City", Value: app.city },
      { Field: "Country", Value: app.country },
      { Field: "", Value: "" },
      { Field: "=== VISA DETAILS ===", Value: "" },
      { Field: "Visa Type", Value: VISA_TYPE_LABELS[app.visa_type] || app.visa_type },
      { Field: "Duration of Stay", Value: app.duration_of_stay },
      { Field: "Intended Arrival Date", Value: app.intended_arrival_date },
      { Field: "", Value: "" },
      { Field: "=== FAMILY DETAILS ===", Value: "" },
      { Field: "Father Name", Value: app.father_name || "" },
      { Field: "Father Nationality", Value: app.father_nationality || "" },
      { Field: "Mother Name", Value: app.mother_name || "" },
      { Field: "Mother Nationality", Value: app.mother_nationality || "" },
      { Field: "Spouse Name", Value: app.spouse_name || "" },
      { Field: "Spouse Nationality", Value: app.spouse_nationality || "" },
      { Field: "", Value: "" },
      { Field: "=== INDIA CONTACT ===", Value: "" },
      { Field: "Indian Contact Address", Value: app.indian_contact_address },
      { Field: "Indian Contact Person", Value: app.indian_contact_person || "" },
      { Field: "Indian Contact Phone", Value: app.indian_contact_phone || "" },
      { Field: "", Value: "" },
      { Field: "=== REFERENCES ===", Value: "" },
      { Field: "Reference India Name", Value: app.reference_india_name || "" },
      { Field: "Reference India Address", Value: app.reference_india_address || "" },
      { Field: "Reference India Phone", Value: app.reference_india_phone || "" },
      { Field: "Reference Home Name", Value: app.reference_home_name || "" },
      { Field: "Reference Home Address", Value: app.reference_home_address || "" },
      { Field: "Reference Home Phone", Value: app.reference_home_phone || "" },
      { Field: "", Value: "" },
      { Field: "=== PREVIOUS VISITS ===", Value: "" },
      { Field: "Visited India Before", Value: app.visited_india_before ? "Yes" : "No" },
      { Field: "Previous Visa Number", Value: app.previous_visa_number || "" },
      { Field: "Previous Visa Type", Value: app.previous_visa_type || "" },
      { Field: "Previous Visa Place of Issue", Value: app.previous_visa_place_of_issue || "" },
      { Field: "Previous India Address", Value: app.previous_india_address || "" },
      { Field: "Previous India Cities", Value: app.previous_india_cities || "" },
      { Field: "Countries Visited (Last 10 Years)", Value: (app.countries_visited_last_10_years || []).join(", ") },
      { Field: "", Value: "" },
      { Field: "Declaration Accepted", Value: app.declaration_accepted ? "Yes" : "No" },
    ];

    try {
      await exportSingleSheet(
        applicationData, 
        "Application Details", 
        `visa-application-${app.full_name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success("Application exported to Excel");
    } catch (error) {
      console.error("Excel export failed:", error);
      toast.error("Failed to export Excel file");
    }
  };

  const exportToExcel = async () => {
    const data = filteredApplications.map((a) => ({
      "Application ID": a.id,
      "Status": a.status,
      "Submitted At": a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : "N/A",
      "Surname": a.surname || "",
      "Given Name": a.given_name || "",
      "Full Name": a.full_name,
      "Date of Birth": a.date_of_birth,
      "Gender": a.gender,
      "Place of Birth": a.place_of_birth,
      "Country of Birth": a.country_of_birth,
      "Nationality": a.nationality,
      "Religion": a.religion || "",
      "Marital Status": a.marital_status || "",
      "Educational Qualification": a.educational_qualification || "",
      "Email": a.email,
      "Mobile ISD": a.mobile_isd,
      "Mobile Number": a.mobile_number,
      "Residential Address": a.residential_address,
      "City": a.city,
      "Country": a.country,
      "Passport Number": a.passport_number,
      "Passport Issue Date": a.passport_issue_date,
      "Passport Expiry Date": a.passport_expiry_date,
      "Passport Place of Issue": a.passport_place_of_issue || "",
      "Visa Type": VISA_TYPE_LABELS[a.visa_type] || a.visa_type,
      "Duration of Stay": a.duration_of_stay,
      "Intended Arrival Date": a.intended_arrival_date,
      "Father Name": a.father_name || "",
      "Father Nationality": a.father_nationality || "",
      "Mother Name": a.mother_name || "",
      "Mother Nationality": a.mother_nationality || "",
      "Spouse Name": a.spouse_name || "",
      "Spouse Nationality": a.spouse_nationality || "",
      "Indian Contact Address": a.indian_contact_address,
      "Indian Contact Person": a.indian_contact_person || "",
      "Indian Contact Phone": a.indian_contact_phone || "",
      "Reference India Name": a.reference_india_name || "",
      "Reference India Address": a.reference_india_address || "",
      "Reference India Phone": a.reference_india_phone || "",
      "Reference Home Name": a.reference_home_name || "",
      "Reference Home Address": a.reference_home_address || "",
      "Reference Home Phone": a.reference_home_phone || "",
      "Visited India Before": a.visited_india_before ? "Yes" : "No",
      "Previous Visa Number": a.previous_visa_number || "",
      "Previous Visa Type": a.previous_visa_type || "",
      "Countries Visited (Last 10 Years)": (a.countries_visited_last_10_years || []).join(", "),
      "Locked": a.is_locked ? "Yes" : "No",
      "Created At": new Date(a.created_at).toLocaleDateString(),
    }));

    try {
      await exportToExcelFile(
        [{ name: "Applications", data }],
        `visa-applications-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success("Exported to Excel");
    } catch (error) {
      console.error("Excel export failed:", error);
      toast.error("Failed to export Excel file");
    }
  };

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

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Visa Applications</h1>
            <p className="text-muted-foreground">Manage all visa applications</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadApplications}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export All to Excel
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{filteredApplications.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {filteredApplications.filter((a) => a.status === "submitted").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredApplications.filter((a) => a.status === "under_review").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">
                {filteredApplications.filter((a) => a.status === "approved").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {filteredApplications.filter((a) => a.status === "completed").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {filteredApplications.filter((a) => a.status === "rejected").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, passport, nationality..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Visa Type</TableHead>
                  <TableHead>Arrival Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{app.full_name}</p>
                          <p className="text-xs text-muted-foreground">{app.email}</p>
                          <p className="text-xs text-muted-foreground">Passport: {app.passport_number}</p>
                          {app.is_locked && (
                            <Badge variant="outline" className="mt-1 text-xs">Locked</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{app.nationality}</Badge>
                      </TableCell>
                      <TableCell>{VISA_TYPE_LABELS[app.visa_type] || app.visa_type}</TableCell>
                      <TableCell>
                        {app.intended_arrival_date 
                          ? new Date(app.intended_arrival_date).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={app.status} 
                          onValueChange={(value) => updateStatus(app.id, value, app)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedApplication(app)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportSingleApplication(app)}
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Application Detail Dialog - Uses new component */}
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Application: {selectedApplication?.full_name}
              </DialogTitle>
            </DialogHeader>
            {selectedApplication && (
              <ApplicationDetailView 
                application={selectedApplication} 
                onClose={() => setSelectedApplication(null)} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminApplications;
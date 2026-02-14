import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, FileText, User, MapPin, Users, Plane, History, Phone, Shield, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ViewApplication = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [arrivalPointName, setArrivalPointName] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      loadApplication();
    }
  }, [user, id]);

  const loadApplication = async () => {
    try {
      const { data: appData, error: appError } = await supabase
        .from("visa_applications")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (appError) throw appError;
      setApplication(appData);

      if (appData.arrival_point_id) {
        const { data: arrivalData } = await supabase
          .from("arrival_points")
          .select("name, city")
          .eq("id", appData.arrival_point_id)
          .maybeSingle();
        
        if (arrivalData) {
          setArrivalPointName(`${arrivalData.name}${arrivalData.city ? ` - ${arrivalData.city}` : ""}`);
        }
      }

      const { data: docs } = await supabase
        .from("application_documents")
        .select("*")
        .eq("application_id", id);

      setDocuments(docs || []);
    } catch (error) {
      console.error("Error loading application:", error);
      toast.error("Failed to load application");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive"; className?: string }> = {
      draft: { variant: "secondary" },
      submitted: { variant: "default", className: "bg-blue-500" },
      in_review: { variant: "default", className: "bg-yellow-500" },
      completed: { variant: "default", className: "bg-green-500" },
      rejected: { variant: "destructive" },
    };
    const { variant, className } = config[status] || { variant: "secondary" };
    const label = status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
    return <Badge variant={variant} className={className}>{label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const InfoRow = ({ label, value }: { label: string; value: string | undefined | null | boolean }) => (
    <div className="py-2 border-b border-border/50 last:border-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">
        {typeof value === "boolean" ? (value ? "Yes" : "No") : (value || "N/A")}
      </p>
    </div>
  );

  if (authLoading) return null;

  if (!application) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Application not found</p>
      </div>
    );
  }

  const tabs = [
    { value: "applicant", label: "Applicant", icon: User },
    { value: "passport", label: "Passport", icon: FileText },
    { value: "address", label: "Address", icon: MapPin },
    { value: "family", label: "Family", icon: Users },
    { value: "visa", label: "Visa", icon: Plane },
    { value: "previous", label: "Previous", icon: History },
    { value: "references", label: "Refs", icon: Phone },
    { value: "security", label: "Security", icon: Shield },
    { value: "documents", label: "Docs", icon: Upload },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{application.full_name}</CardTitle>
                <CardDescription>
                  {application.visa_type?.charAt(0).toUpperCase() + application.visa_type?.slice(1)} Visa Application
                </CardDescription>
              </div>
              {getStatusBadge(application.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(application.created_at)}</p>
              </div>
              {application.submitted_at && (
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">{formatDate(application.submitted_at)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="applicant" className="w-full">
          <TabsList className="grid w-full grid-cols-9 mb-6 h-auto">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Applicant Details */}
          <TabsContent value="applicant">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Applicant Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1">
                <InfoRow label="Surname" value={application.surname} />
                <InfoRow label="Given Name" value={application.given_name} />
                <InfoRow label="Full Name" value={application.full_name} />
                <InfoRow label="Date of Birth" value={formatDate(application.date_of_birth)} />
                <InfoRow label="Gender" value={application.gender?.charAt(0).toUpperCase() + application.gender?.slice(1)} />
                <InfoRow label="Place of Birth" value={application.place_of_birth} />
                <InfoRow label="Country of Birth" value={application.country_of_birth} />
                <InfoRow label="Nationality" value={application.nationality} />
                <InfoRow label="Nationality by Birth" value={application.nationality_by_birth} />
                <InfoRow label="Religion" value={application.religion} />
                <InfoRow label="Marital Status" value={application.marital_status} />
                <InfoRow label="Educational Qualification" value={application.educational_qualification} />
                <InfoRow label="Visible Identification Marks" value={application.visible_identification_marks} />
                <InfoRow label="Changed Name" value={application.changed_name} />
                {application.changed_name && (
                  <InfoRow label="Changed Name Details" value={application.changed_name_details} />
                )}
                <InfoRow label="Citizenship ID" value={application.citizenship_id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Passport Details */}
          <TabsContent value="passport">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Passport Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1">
                <InfoRow label="Passport Number" value={application.passport_number} />
                <InfoRow label="Place of Issue" value={application.passport_place_of_issue} />
                <InfoRow label="Issue Date" value={formatDate(application.passport_issue_date)} />
                <InfoRow label="Expiry Date" value={formatDate(application.passport_expiry_date)} />
                <InfoRow label="Other Passport Held" value={application.other_passport_held} />
                {application.other_passport_held && (
                  <>
                    <InfoRow label="Other Passport Country" value={application.other_passport_country} />
                    <InfoRow label="Other Passport Number" value={application.other_passport_number} />
                    <InfoRow label="Other Passport Nationality" value={application.other_passport_nationality} />
                    <InfoRow label="Other Passport Place of Issue" value={application.other_passport_place_of_issue} />
                    <InfoRow label="Other Passport Issue Date" value={formatDate(application.other_passport_issue_date)} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Address Details */}
          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1">
                <h4 className="font-semibold mt-2 mb-1">Present Address</h4>
                <InfoRow label="House/Street" value={application.present_address_house_street} />
                <InfoRow label="Village/Town" value={application.present_address_village_town} />
                <InfoRow label="State" value={application.present_address_state} />
                <InfoRow label="Postal Code" value={application.present_address_postal_code} />
                <InfoRow label="Country" value={application.present_address_country} />
                <InfoRow label="Phone" value={application.present_address_phone} />
                
                <h4 className="font-semibold mt-4 mb-1">Permanent Address</h4>
                <InfoRow label="Same as Present" value={application.permanent_address_same_as_present} />
                {!application.permanent_address_same_as_present && (
                  <>
                    <InfoRow label="House/Street" value={application.permanent_address_house_street} />
                    <InfoRow label="Village/Town" value={application.permanent_address_village_town} />
                    <InfoRow label="State" value={application.permanent_address_state} />
                  </>
                )}
                
                <h4 className="font-semibold mt-4 mb-1">Contact</h4>
                <InfoRow label="Email" value={application.email} />
                <InfoRow label="Phone" value={`${application.mobile_isd} ${application.mobile_number}`} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Family Details */}
          <TabsContent value="family">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1">
                <h4 className="font-semibold mt-2 mb-1">Father's Details</h4>
                <InfoRow label="Name" value={application.father_name} />
                <InfoRow label="Nationality" value={application.father_nationality} />
                <InfoRow label="Previous Nationality" value={application.father_prev_nationality} />
                <InfoRow label="Place of Birth" value={application.father_place_of_birth} />
                <InfoRow label="Country of Birth" value={application.father_country_of_birth} />
                
                <h4 className="font-semibold mt-4 mb-1">Mother's Details</h4>
                <InfoRow label="Name" value={application.mother_name} />
                <InfoRow label="Nationality" value={application.mother_nationality} />
                <InfoRow label="Previous Nationality" value={application.mother_prev_nationality} />
                <InfoRow label="Place of Birth" value={application.mother_place_of_birth} />
                <InfoRow label="Country of Birth" value={application.mother_country_of_birth} />
                
                {application.marital_status === "married" && (
                  <>
                    <h4 className="font-semibold mt-4 mb-1">Spouse's Details</h4>
                    <InfoRow label="Name" value={application.spouse_name} />
                    <InfoRow label="Nationality" value={application.spouse_nationality} />
                    <InfoRow label="Previous Nationality" value={application.spouse_prev_nationality} />
                    <InfoRow label="Place of Birth" value={application.spouse_place_of_birth} />
                    <InfoRow label="Country of Birth" value={application.spouse_country_of_birth} />
                  </>
                )}
                
                <h4 className="font-semibold mt-4 mb-1">Pakistan Heritage</h4>
                <InfoRow label="Pakistan Heritage" value={application.pakistan_heritage} />
                {application.pakistan_heritage && (
                  <InfoRow label="Details" value={application.pakistan_heritage_details} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visa Details */}
          <TabsContent value="visa">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Visa & Travel Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1">
                <InfoRow label="Visa Type" value={application.visa_type === "other" ? application.visa_type_other : application.visa_type?.charAt(0).toUpperCase() + application.visa_type?.slice(1)} />
                <InfoRow label="Duration of Stay" value={application.duration_of_stay} />
                <InfoRow label="Intended Arrival Date" value={formatDate(application.intended_arrival_date)} />
                <InfoRow label="Arrival Point" value={arrivalPointName || "N/A"} />
                <InfoRow label="Expected Port of Exit" value={application.expected_port_of_exit} />
                <InfoRow label="Purpose of Visit" value={application.purpose_of_visit} />
                <InfoRow label="Places to Visit (1)" value={application.places_to_visit_1} />
                <InfoRow label="Places to Visit (2)" value={application.places_to_visit_2} />
                
                <h4 className="font-semibold mt-4 mb-1">Stay Details</h4>
                <InfoRow label="Hotel Name" value={application.hotel_name} />
                <InfoRow label="Hotel Address" value={application.hotel_address} />
                <InfoRow label="Booked Through Operator" value={application.hotel_booked_through_operator} />
                
                <h4 className="font-semibold mt-4 mb-1">Residency</h4>
                <InfoRow label="Lived in Applying Country 2+ Years" value={application.lived_in_applying_country_2_years} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Previous Visa */}
          <TabsContent value="previous">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Previous Visa & Travel History
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1">
                <InfoRow label="Visited India Before" value={application.visited_india_before} />
                {application.visited_india_before && (
                  <>
                    <InfoRow label="Previous India Address" value={application.previous_india_address} />
                    <InfoRow label="Cities Visited" value={application.previous_india_cities} />
                    <InfoRow label="Previous Visa Number" value={application.previous_visa_number} />
                    <InfoRow label="Previous Visa Type" value={application.previous_visa_type} />
                    <InfoRow label="Place of Issue" value={application.previous_visa_place_of_issue} />
                    <InfoRow label="Date of Issue" value={formatDate(application.previous_visa_issue_date)} />
                  </>
                )}
                
                <h4 className="font-semibold mt-4 mb-1">Permission Refusal</h4>
                <InfoRow label="Permission Refused Before" value={application.permission_refused_before} />
                {application.permission_refused_before && (
                  <InfoRow label="Details" value={application.permission_refused_details} />
                )}
                
                <h4 className="font-semibold mt-4 mb-1">Countries Visited (Last 10 Years)</h4>
                <InfoRow label="Countries" value={application.countries_visited_last_10_years?.join(", ") || "None"} />
                
                <h4 className="font-semibold mt-4 mb-1">SAARC Countries</h4>
                <InfoRow label="Visited SAARC Countries" value={application.visited_saarc_countries} />
                {application.visited_saarc_countries && (
                  <InfoRow label="Details" value={application.saarc_countries_details} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* References */}
          <TabsContent value="references">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  References
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1">
                <h4 className="font-semibold mt-2 mb-1">Reference in India</h4>
                <InfoRow label="Name" value={application.reference_india_name} />
                <InfoRow label="Address" value={application.reference_india_address} />
                <InfoRow label="Phone" value={application.reference_india_phone} />
                
                <h4 className="font-semibold mt-4 mb-1">Reference in Home Country</h4>
                <InfoRow label="Name" value={application.reference_home_name} />
                <InfoRow label="Address" value={application.reference_home_address} />
                <InfoRow label="Phone" value={application.reference_home_phone} />
                
                <h4 className="font-semibold mt-4 mb-1">Indian Contact</h4>
                <InfoRow label="Contact Person" value={application.indian_contact_person} />
                <InfoRow label="Address" value={application.indian_contact_address} />
                <InfoRow label="Phone" value={application.indian_contact_phone} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Questions */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1">
                <InfoRow label="Arrested/Convicted" value={application.security_arrested_convicted} />
                {application.security_arrested_convicted && (
                  <InfoRow label="Details" value={application.security_arrested_details} />
                )}
                
                <InfoRow label="Refused Entry/Deported" value={application.security_refused_entry_deported} />
                {application.security_refused_entry_deported && (
                  <InfoRow label="Details" value={application.security_refused_entry_details} />
                )}
                
                <InfoRow label="Criminal Activities" value={application.security_criminal_activities} />
                {application.security_criminal_activities && (
                  <InfoRow label="Details" value={application.security_criminal_details} />
                )}
                
                <InfoRow label="Terrorist Activities" value={application.security_terrorist_activities} />
                {application.security_terrorist_activities && (
                  <InfoRow label="Details" value={application.security_terrorist_details} />
                )}
                
                <InfoRow label="Terrorist Views" value={application.security_terrorist_views} />
                {application.security_terrorist_views && (
                  <InfoRow label="Details" value={application.security_terrorist_views_details} />
                )}
                
                <InfoRow label="Asylum Sought" value={application.security_asylum_sought} />
                {application.security_asylum_sought && (
                  <InfoRow label="Details" value={application.security_asylum_details} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Uploaded Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No documents uploaded</p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {doc.document_type.replace("_", " ")}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(doc.uploaded_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
};

export default ViewApplication;

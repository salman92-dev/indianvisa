import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Download, Search, Loader2, RefreshCw, ChevronDown, Users, Eye, FileSpreadsheet } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { exportToExcelFile } from "@/lib/excelExport";

interface Traveler {
  id: string;
  full_name: string;
  passport_number: string;
  nationality: string;
  date_of_birth: string;
  gender: string;
  email: string | null;
  phone: string | null;
  application_status: string;
}

interface Booking {
  id: string;
  user_id: string;
  total_travelers: number;
  total_amount_paid: number;
  currency: string;
  visa_type: string;
  price_per_traveler: number;
  payment_status: string;
  payment_transaction_id: string | null;
  created_at: string;
  travelers?: Traveler[];
}

const VISA_TYPE_LABELS: Record<string, string> = {
  '30_days': '30-Day e-Tourist Visa',
  '1_year': '1-Year e-Tourist Visa',
  '5_years': '5-Year e-Tourist Visa',
};

const getPricingCategory = (currency: string): string => {
  switch (currency) {
    case 'USD': return 'USA / Rest of World';
    case 'GBP': return 'United Kingdom';
    case 'EUR': return 'European Union';
    default: return 'Unknown';
  }
};

const AdminBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visaTypeFilter, setVisaTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && user) {
      checkAdminAndLoad();
    } else if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, visaTypeFilter, statusFilter]);

  const checkAdminAndLoad = async () => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!data) {
        navigate("/dashboard");
        return;
      }

      await loadBookings();
    } catch (error) {
      console.error("Error:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      // Load bookings with travelers
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;

      // Load travelers for all bookings
      const bookingIds = bookingsData?.map(b => b.id) || [];
      const { data: travelersData, error: travelersError } = await supabase
        .from("travelers")
        .select("*")
        .in("booking_id", bookingIds);

      if (travelersError) throw travelersError;

      // Map travelers to bookings
      const bookingsWithTravelers = bookingsData?.map(booking => ({
        ...booking,
        travelers: travelersData?.filter(t => t.booking_id === booking.id) || [],
      })) || [];

      setBookings(bookingsWithTravelers);
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Failed to load bookings");
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.id.toLowerCase().includes(term) ||
          b.payment_transaction_id?.toLowerCase().includes(term) ||
          b.travelers?.some(t => 
            t.full_name.toLowerCase().includes(term) ||
            t.passport_number.toLowerCase().includes(term) ||
            t.email?.toLowerCase().includes(term)
          )
      );
    }

    if (visaTypeFilter !== "all") {
      filtered = filtered.filter((b) => b.visa_type === visaTypeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.payment_status === statusFilter);
    }

    setFilteredBookings(filtered);
  };

  const toggleExpanded = (bookingId: string) => {
    setExpandedBookings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  const exportToCSV = () => {
    const headers = [
      "Booking ID", "Date", "Visa Type", "Pricing Category", "Travelers", 
      "Price/Person", "Total Amount", "Currency", "Status", "Traveler Names"
    ];
    const rows = filteredBookings.map((b) => [
      b.id,
      new Date(b.created_at).toLocaleDateString(),
      VISA_TYPE_LABELS[b.visa_type] || b.visa_type,
      getPricingCategory(b.currency),
      b.total_travelers,
      b.price_per_traveler,
      b.total_amount_paid,
      b.currency,
      b.payment_status,
      b.travelers?.map(t => t.full_name).join("; ") || "",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Bookings exported to CSV");
  };

  const exportToExcel = async () => {
    // Bookings summary sheet
    const bookingsData = filteredBookings.map((b) => ({
      "Booking ID": b.id,
      "Date": new Date(b.created_at).toLocaleDateString(),
      "Visa Type": VISA_TYPE_LABELS[b.visa_type] || b.visa_type,
      "Pricing Category": getPricingCategory(b.currency),
      "Total Travelers": b.total_travelers,
      "Price Per Traveler": b.price_per_traveler,
      "Total Amount": b.total_amount_paid,
      "Currency": b.currency,
      "Payment Status": b.payment_status,
      "Transaction ID": b.payment_transaction_id || "N/A",
    }));
    
    // Travelers detail sheet
    const travelersData: Record<string, any>[] = [];
    filteredBookings.forEach((b) => {
      b.travelers?.forEach((t, index) => {
        travelersData.push({
          "Booking ID": b.id,
          "Traveler #": index + 1,
          "Full Name": t.full_name,
          "Passport Number": t.passport_number,
          "Nationality": t.nationality,
          "Date of Birth": t.date_of_birth,
          "Gender": t.gender,
          "Email": t.email || "N/A",
          "Phone": t.phone || "N/A",
          "Application Status": t.application_status,
          "Visa Type": VISA_TYPE_LABELS[b.visa_type] || b.visa_type,
          "Amount Paid": b.price_per_traveler,
          "Currency": b.currency,
          "Booking Date": new Date(b.created_at).toLocaleDateString(),
        });
      });
    });
    
    try {
      await exportToExcelFile(
        [
          { name: "Bookings", data: bookingsData },
          { name: "Travelers", data: travelersData },
        ],
        `visa-bookings-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success("Exported to Excel successfully!");
    } catch (error) {
      console.error("Excel export failed:", error);
      toast.error("Failed to export Excel file");
    }
  };

  const updateTravelerStatus = async (travelerId: string, newStatus: string, email: string | null) => {
    try {
      const { error } = await supabase
        .from("travelers")
        .update({ application_status: newStatus })
        .eq("id", travelerId);

      if (error) throw error;

      // Update local state
      setBookings(prev => prev.map(booking => ({
        ...booking,
        travelers: booking.travelers?.map(t => 
          t.id === travelerId ? { ...t, application_status: newStatus } : t
        )
      })));

      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      
      // TODO: Send status update email when edge function is ready
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      completed: "bg-green-500",
      pending: "bg-yellow-500",
      failed: "bg-red-500",
    };

    return (
      <Badge className={config[status] || "bg-gray-500"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getVisaTypeBadge = (visaType: string) => {
    const config: Record<string, string> = {
      '30_days': "bg-blue-500",
      '1_year': "bg-purple-500",
      '5_years': "bg-primary",
    };

    return (
      <Badge className={config[visaType] || "bg-gray-500"}>
        {VISA_TYPE_LABELS[visaType] || visaType}
      </Badge>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const totalRevenue = filteredBookings
    .filter((b) => b.payment_status === "completed")
    .reduce((sum, b) => sum + b.total_amount_paid, 0);

  const totalTravelers = filteredBookings.reduce((sum, b) => sum + b.total_travelers, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Bookings</h1>
            <p className="text-muted-foreground">Manage visa bookings and traveler details</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadBookings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{filteredBookings.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Travelers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalTravelers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Completed Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredBookings.filter((b) => b.payment_status === "pending").length}
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
                  placeholder="Search by booking ID, traveler name, passport..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={visaTypeFilter} onValueChange={setVisaTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by visa type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visa Types</SelectItem>
                  <SelectItem value="30_days">30-Day Visa</SelectItem>
                  <SelectItem value="1_year">1-Year Visa</SelectItem>
                  <SelectItem value="5_years">5-Year Visa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No bookings found
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card key={booking.id}>
                <Collapsible
                  open={expandedBookings.has(booking.id)}
                  onOpenChange={() => toggleExpanded(booking.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <ChevronDown 
                            className={`h-5 w-5 transition-transform ${
                              expandedBookings.has(booking.id) ? 'rotate-180' : ''
                            }`}
                          />
                          <div>
                            <p className="font-mono text-sm text-muted-foreground">
                              {booking.id.slice(0, 8)}...
                            </p>
                            <p className="text-sm">
                              {new Date(booking.created_at).toLocaleDateString('en-AE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {getVisaTypeBadge(booking.visa_type)}
                          <Badge variant="outline">
                            {getPricingCategory(booking.currency)}
                          </Badge>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{booking.total_travelers}</span>
                          </div>
                          <p className="font-bold">
                            {booking.currency} {booking.total_amount_paid.toFixed(2)}
                          </p>
                          {getStatusBadge(booking.payment_status)}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Price per Traveler</p>
                          <p className="font-semibold">{booking.currency} {booking.price_per_traveler?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Transaction ID</p>
                          <p className="font-mono text-sm">{booking.payment_transaction_id || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Pricing Category</p>
                          <p className="font-semibold">{getPricingCategory(booking.currency)}</p>
                        </div>
                      </div>

                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Travelers ({booking.travelers?.length || 0})
                      </h4>
                      
                      {booking.travelers && booking.travelers.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Passport</TableHead>
                              <TableHead>Nationality</TableHead>
                              <TableHead>DOB</TableHead>
                              <TableHead>Gender</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {booking.travelers.map((traveler) => (
                              <TableRow key={traveler.id}>
                                <TableCell className="font-medium">{traveler.full_name}</TableCell>
                                <TableCell className="font-mono">{traveler.passport_number}</TableCell>
                                <TableCell>{traveler.nationality}</TableCell>
                                <TableCell>
                                  {new Date(traveler.date_of_birth).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="capitalize">{traveler.gender}</TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <p>{traveler.email || 'N/A'}</p>
                                    <p className="text-muted-foreground">{traveler.phone || 'N/A'}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={traveler.application_status}
                                    onValueChange={(value) => updateTravelerStatus(traveler.id, value, traveler.email)}
                                  >
                                    <SelectTrigger className="w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="under_review">Under Review</SelectItem>
                                      <SelectItem value="submitted_to_gov">Submitted to Gov</SelectItem>
                                      <SelectItem value="approved">Approved</SelectItem>
                                      <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground text-sm">No travelers found</p>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;

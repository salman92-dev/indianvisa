import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CreditCard, 
  DollarSign, 
  Globe, 
  MapPin, 
  FileText,
  Users,
  TrendingUp,
  Loader2
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminDashboard = () => {
  const { isAdmin, loading, user } = useAdminAuth();
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalRevenue: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalUsers: 0,
    totalLeads: 0,
    countries: 0,
    arrivalPoints: 0,
  });

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      const [paymentsRes, applicationsRes, countriesRes, arrivalPointsRes, profilesRes, leadsRes] = await Promise.all([
        supabase.from("payments").select("total_amount, status"),
        supabase.from("visa_applications").select("status"),
        supabase.from("countries").select("id", { count: "exact" }),
        supabase.from("arrival_points").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("leads").select("id", { count: "exact" }),
      ]);

      const completedPayments = paymentsRes.data?.filter(p => p.status === "completed") || [];
      const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
      const pendingApps = applicationsRes.data?.filter(a => a.status === "submitted" || a.status === "in_review") || [];

      setStats({
        totalPayments: paymentsRes.data?.length || 0,
        totalRevenue,
        totalApplications: applicationsRes.data?.length || 0,
        pendingApplications: pendingApps.length,
        totalUsers: profilesRes.count || 0,
        totalLeads: leadsRes.count || 0,
        countries: countriesRes.count || 0,
        arrivalPoints: arrivalPointsRes.count || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your visa application system</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{stats.totalPayments} total payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">{stats.pendingApplications} pending review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Total accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Leads & Newsletter</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground">{stats.countries} countries configured</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-6 flex flex-col gap-2"
            asChild
          >
            <Link to="/admin/users">
              <Users className="h-6 w-6" />
              <span>View Users</span>
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-6 flex flex-col gap-2"
            asChild
          >
            <Link to="/admin/applications">
              <FileText className="h-6 w-6" />
              <span>Applications</span>
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-6 flex flex-col gap-2"
            asChild
          >
            <Link to="/admin/payments">
              <CreditCard className="h-6 w-6" />
              <span>View Payments</span>
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-6 flex flex-col gap-2"
            asChild
          >
            <Link to="/admin/pricing">
              <DollarSign className="h-6 w-6" />
              <span>Manage Pricing</span>
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-6 flex flex-col gap-2"
            asChild
          >
            <Link to="/admin/leads">
              <Globe className="h-6 w-6" />
              <span>Leads & Newsletter</span>
            </Link>
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentCredits } from "@/hooks/usePaymentCredits";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, CheckCircle, CreditCard, Ticket, Edit3 } from "lucide-react";
import ApplicationsList from "@/components/dashboard/ApplicationsList";
import PaymentHistory from "@/components/dashboard/PaymentHistory";

interface BookingDraft {
  nationality: string;
  visa_duration: string;
  travelers: any[];
  updated_at: string;
}

const Dashboard = () => {
  const { user, session, loading } = useAuth();
  const { availableCredits, loading: creditsLoading } = usePaymentCredits();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    drafts: 0,
    completed: 0,
    total: 0,
  });
  const [savedDraft, setSavedDraft] = useState<BookingDraft | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      navigate("/login");
    }
  }, [session, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadStats();
      loadSavedDraft();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from("visa_applications")
        .select("status");

      if (error) throw error;

      const drafts = data?.filter((a) => a.status === "draft").length || 0;
      const completed = data?.filter((a) => a.status === "completed").length || 0;

      setStats({
        drafts,
        completed,
        total: data?.length || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadSavedDraft = () => {
    if (!user) return;
    const draft = localStorage.getItem(`booking_draft_${user.id}`);
    if (draft) {
      try {
        setSavedDraft(JSON.parse(draft));
      } catch (e) {
        console.error("Error loading draft:", e);
      }
    }
  };

  const clearDraft = () => {
    if (!user) return;
    localStorage.removeItem(`booking_draft_${user.id}`);
    setSavedDraft(null);
  };

  if (!user) return null;

  return (
    <div className="py-12 px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome Back!</h1>
          <p className="text-lg text-muted-foreground">{user.email}</p>
        </div>

        {/* Available Credits Banner */}
        {availableCredits > 0 && (
          <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500 text-white">
                  <Ticket className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-800 dark:text-green-200">
                    You have {availableCredits} application credit{availableCredits > 1 ? 's' : ''} available!
                  </h3>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    You've paid for visa applications. Click below to use your credit and start an application.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate("/apply-visa?useCredit=true")}
                className="bg-green-600 hover:bg-green-700"
              >
                Use Credit & Apply Now
              </Button>
            </div>
          </div>
        )}

        {/* Saved Booking Draft Banner */}
        {savedDraft && savedDraft.travelers && savedDraft.travelers.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500 text-white">
                  <Edit3 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200">
                    Continue Your Booking
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    You have a saved booking with {savedDraft.travelers.length} traveler{savedDraft.travelers.length > 1 ? 's' : ''}.
                    Last updated: {new Date(savedDraft.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={clearDraft}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Discard
                </Button>
                <Button 
                  onClick={() => navigate("/book-visa")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue Booking
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(availableCredits > 0 ? "/apply-visa?useCredit=true" : "/book-visa")}>
            <CardHeader className="pb-2">
              <div className="p-3 rounded-full bg-primary/10 w-fit mb-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">New Application</CardTitle>
              <CardDescription>
                {availableCredits > 0 
                  ? `Use your credit (${availableCredits} available)` 
                  : "Book and start a new application"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(availableCredits > 0 ? "/apply-visa?useCredit=true" : "/book-visa");
                }}
              >
                {availableCredits > 0 ? "Apply Now" : "Book Visa"}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="p-3 rounded-full bg-yellow-100 w-fit mb-2">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle className="text-lg">Drafts</CardTitle>
              <CardDescription>Continue where you left off</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.drafts}</p>
              <p className="text-sm text-muted-foreground">Saved drafts</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="p-3 rounded-full bg-green-100 w-fit mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Completed</CardTitle>
              <CardDescription>Successfully processed</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Applications</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="p-3 rounded-full bg-blue-100 w-fit mb-2">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Total</CardTitle>
              <CardDescription>All applications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Applications</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Applications and Payments */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="applications">
            <ApplicationsList />
          </TabsContent>
          
          <TabsContent value="payments">
            <PaymentHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;

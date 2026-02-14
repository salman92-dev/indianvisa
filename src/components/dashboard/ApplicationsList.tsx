import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Application {
  id: string;
  full_name: string;
  visa_type: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
}

const ApplicationsList = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("visa_applications")
        .select("id, full_name, visa_type, status, created_at, submitted_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const deleteApplication = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("visa_applications")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setApplications((prev) => prev.filter((app) => app.id !== id));
      toast.success("Application deleted");
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Failed to delete application");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
      draft: { variant: "secondary" },
      submitted: { variant: "default", className: "bg-blue-500 hover:bg-blue-600" },
      in_review: { variant: "default", className: "bg-yellow-500 hover:bg-yellow-600" },
      completed: { variant: "default", className: "bg-green-500 hover:bg-green-600" },
      rejected: { variant: "destructive" },
    };

    const { variant, className } = config[status] || { variant: "secondary" };
    const label = status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());

    return (
      <Badge variant={variant} className={className}>
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Applications</CardTitle>
          <CardDescription>Track the status of your visa applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start your first visa application to see it here
            </p>
            <Button onClick={() => navigate("/apply-visa")}>
              Create New Application
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Applications</CardTitle>
        <CardDescription>Track the status of your visa applications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
            >
              <div className="space-y-1">
                <p className="font-medium">{app.full_name || "Unnamed Application"}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {app.visa_type} Visa
                </p>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(app.created_at).toLocaleDateString('en-AE')}
                  {app.submitted_at && ` • Submitted: ${new Date(app.submitted_at).toLocaleDateString('en-AE')}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(app.status || "draft")}
                <div className="flex gap-2">
                  {app.status === "draft" ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/apply-visa?id=${app.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deletingId === app.id}
                          >
                            {deletingId === app.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Application?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your draft application.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteApplication(app.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/application/${app.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationsList;

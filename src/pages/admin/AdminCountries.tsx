import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

interface Country {
  id: string;
  name: string;
  code: string;
  isd_code: string | null;
  is_active: boolean;
}

const AdminCountries = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    isd_code: "",
    is_active: true,
  });

  useEffect(() => {
    if (!authLoading && user) {
      checkAdminAndLoad();
    } else if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading]);

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

      await loadCountries();
    } catch (error) {
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadCountries = async () => {
    const { data, error } = await supabase
      .from("countries")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to load countries");
      return;
    }
    setCountries(data || []);
  };

  const openDialog = (item?: Country) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        name: item.name,
        code: item.code,
        isd_code: item.isd_code || "",
        is_active: item.is_active ?? true,
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", code: "", isd_code: "", is_active: true });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast.error("Please fill required fields");
      return;
    }

    const payload = {
      name: formData.name,
      code: formData.code.toUpperCase(),
      isd_code: formData.isd_code || null,
      is_active: formData.is_active,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("countries").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Country updated");
      } else {
        const { error } = await supabase.from("countries").insert(payload);
        if (error) throw error;
        toast.success("Country added");
      }

      setDialogOpen(false);
      loadCountries();
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("countries").update({ is_active: !current }).eq("id", id);
    if (error) {
      toast.error("Failed to update");
      return;
    }
    loadCountries();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Countries</h1>
            <p className="text-muted-foreground">Manage country list for visa applications</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Country
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Add"} Country</DialogTitle>
                <DialogDescription>Configure country details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Country Name *</Label>
                  <Input
                    placeholder="e.g., India"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Country Code *</Label>
                    <Input
                      placeholder="e.g., IN"
                      maxLength={2}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ISD Code</Label>
                    <Input
                      placeholder="e.g., +91"
                      value={formData.isd_code}
                      onChange={(e) => setFormData({ ...formData, isd_code: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>ISD Code</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No countries configured
                    </TableCell>
                  </TableRow>
                ) : (
                  countries.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.isd_code || "-"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={item.is_active ?? true}
                          onCheckedChange={() => toggleActive(item.id, item.is_active ?? true)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCountries;

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

interface ArrivalPoint {
  id: string;
  name: string;
  type: string;
  city: string | null;
  code: string | null;
  is_active: boolean;
}

const POINT_TYPES = ["airport", "seaport", "land_border"];

const AdminArrivalPoints = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [arrivalPoints, setArrivalPoints] = useState<ArrivalPoint[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "airport",
    city: "",
    code: "",
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

      await loadArrivalPoints();
    } catch (error) {
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadArrivalPoints = async () => {
    const { data, error } = await supabase
      .from("arrival_points")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to load arrival points");
      return;
    }
    setArrivalPoints(data || []);
  };

  const openDialog = (item?: ArrivalPoint) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        name: item.name,
        type: item.type,
        city: item.city || "",
        code: item.code || "",
        is_active: item.is_active ?? true,
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", type: "airport", city: "", code: "", is_active: true });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.type) {
      toast.error("Please fill required fields");
      return;
    }

    const payload = {
      name: formData.name,
      type: formData.type,
      city: formData.city || null,
      code: formData.code?.toUpperCase() || null,
      is_active: formData.is_active,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("arrival_points").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Arrival point updated");
      } else {
        const { error } = await supabase.from("arrival_points").insert(payload);
        if (error) throw error;
        toast.success("Arrival point added");
      }

      setDialogOpen(false);
      loadArrivalPoints();
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("arrival_points").update({ is_active: !current }).eq("id", id);
    if (error) {
      toast.error("Failed to update");
      return;
    }
    loadArrivalPoints();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      airport: "Airport",
      seaport: "Seaport",
      land_border: "Land Border",
    };
    return labels[type] || type;
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
            <h1 className="text-3xl font-bold">Arrival Points</h1>
            <p className="text-muted-foreground">Manage airports, seaports, and land borders</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Arrival Point
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Add"} Arrival Point</DialogTitle>
                <DialogDescription>Configure arrival point details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    placeholder="e.g., Dubai International Airport"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POINT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {getTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input
                      placeholder="e.g., DXB"
                      maxLength={10}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    placeholder="e.g., Dubai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
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
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arrivalPoints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No arrival points configured
                    </TableCell>
                  </TableRow>
                ) : (
                  arrivalPoints.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{getTypeLabel(item.type)}</TableCell>
                      <TableCell>{item.city || "-"}</TableCell>
                      <TableCell>{item.code || "-"}</TableCell>
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

export default AdminArrivalPoints;

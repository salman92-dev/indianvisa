import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface PricingConfig {
  id: string;
  visa_type: string;
  duration: string;
  country_code: string | null;
  base_amount: number;
  convenience_fee: number;
  tax_rate: number;
  currency: string;
  is_active: boolean;
}

const VISA_TYPES = ["tourist", "business", "medical", "conference", "student", "other"];
const CURRENCIES = ["AED", "USD", "INR"];

const AdminPricing = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pricing, setPricing] = useState<PricingConfig[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    visa_type: "tourist",
    duration: "",
    country_code: "",
    base_amount: "",
    convenience_fee: "0",
    tax_rate: "5",
    currency: "AED",
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

      await loadPricing();
    } catch (error) {
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadPricing = async () => {
    const { data, error } = await supabase
      .from("pricing_config")
      .select("*")
      .order("visa_type", { ascending: true });

    if (error) {
      toast.error("Failed to load pricing");
      return;
    }
    setPricing(data || []);
  };

  const openDialog = (item?: PricingConfig) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        visa_type: item.visa_type,
        duration: item.duration,
        country_code: item.country_code || "",
        base_amount: item.base_amount.toString(),
        convenience_fee: item.convenience_fee?.toString() || "0",
        tax_rate: item.tax_rate?.toString() || "5",
        currency: item.currency,
        is_active: item.is_active ?? true,
      });
    } else {
      setEditingId(null);
      setFormData({
        visa_type: "tourist",
        duration: "",
        country_code: "",
        base_amount: "",
        convenience_fee: "0",
        tax_rate: "5",
        currency: "AED",
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.duration || !formData.base_amount) {
      toast.error("Please fill required fields");
      return;
    }

    const payload = {
      visa_type: formData.visa_type as "tourist" | "business" | "medical" | "conference" | "student" | "other",
      duration: formData.duration,
      country_code: formData.country_code || null,
      base_amount: parseFloat(formData.base_amount),
      convenience_fee: parseFloat(formData.convenience_fee) || 0,
      tax_rate: parseFloat(formData.tax_rate) || 0,
      currency: formData.currency,
      is_active: formData.is_active,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("pricing_config")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Pricing updated");
      } else {
        const { error } = await supabase.from("pricing_config").insert([payload]);
        if (error) throw error;
        toast.success("Pricing created");
      }

      setDialogOpen(false);
      loadPricing();
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("pricing_config")
      .update({ is_active: !current })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
      return;
    }
    loadPricing();
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
            <h1 className="text-3xl font-bold">Pricing Configuration</h1>
            <p className="text-muted-foreground">Manage visa pricing by type, duration, and country</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Pricing
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Add"} Pricing</DialogTitle>
                <DialogDescription>Configure visa pricing</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Visa Type *</Label>
                    <Select
                      value={formData.visa_type}
                      onValueChange={(v) => setFormData({ ...formData, visa_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISA_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration *</Label>
                    <Input
                      placeholder="e.g., 30 days, 90 days"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Country Code (optional)</Label>
                    <Input
                      placeholder="e.g., IN, US"
                      maxLength={2}
                      value={formData.country_code}
                      onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(v) => setFormData({ ...formData, currency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Base Amount *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.base_amount}
                      onChange={(e) => setFormData({ ...formData, base_amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Convenience Fee</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.convenience_fee}
                      onChange={(e) => setFormData({ ...formData, convenience_fee: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
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
                  <TableHead>Visa Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Base Amount</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Tax %</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricing.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No pricing configured
                    </TableCell>
                  </TableRow>
                ) : (
                  pricing.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="capitalize">{item.visa_type}</TableCell>
                      <TableCell>{item.duration}</TableCell>
                      <TableCell>{item.country_code || "All"}</TableCell>
                      <TableCell>{item.currency} {item.base_amount}</TableCell>
                      <TableCell>{item.currency} {item.convenience_fee || 0}</TableCell>
                      <TableCell>{item.tax_rate || 0}%</TableCell>
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

export default AdminPricing;

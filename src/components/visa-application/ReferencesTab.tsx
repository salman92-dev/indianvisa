import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationData } from "@/types/visa-application";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

interface ReferencesTabProps {
  data: ApplicationData;
  updateData: (updates: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
}

const ReferencesTab = ({ data, updateData, onNext, onBack, disabled }: ReferencesTabProps) => {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    // Validate reference in India
    if (!data.reference_india_name || !data.reference_india_address || !data.reference_india_phone) {
      toast.error("Please fill in all reference in India details");
      return;
    }

    // Validate reference in home country
    if (!data.reference_home_name || !data.reference_home_address || !data.reference_home_phone) {
      toast.error("Please fill in all reference in home country details");
      return;
    }

    // Update legacy fields
    updateData({
      indian_contact_person: data.reference_india_name,
      indian_contact_phone: data.reference_india_phone,
      indian_contact_address: data.reference_india_address
    });

    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reference Details</CardTitle>
        <CardDescription>Contact references in India and your home country</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reference in India */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">Reference in India</h3>
            <p className="text-sm text-muted-foreground">
              Please provide details of a person who can be contacted in India in case of emergency.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="reference_india_name">Name *</Label>
              <Input
                id="reference_india_name"
                value={data.reference_india_name}
                onChange={(e) => updateData({ reference_india_name: e.target.value })}
                required
                maxLength={100}
                placeholder="Full name of reference person"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_india_address">Address *</Label>
              <Textarea
                id="reference_india_address"
                value={data.reference_india_address}
                onChange={(e) => updateData({ reference_india_address: e.target.value })}
                required
                maxLength={500}
                rows={2}
                placeholder="Full address in India"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_india_phone">Phone Number *</Label>
              <Input
                id="reference_india_phone"
                type="tel"
                value={data.reference_india_phone}
                onChange={(e) => updateData({ reference_india_phone: e.target.value })}
                required
                maxLength={20}
                placeholder="+91 XXXXXXXXXX"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Reference in Home Country */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">Reference in Your Home Country</h3>
            <p className="text-sm text-muted-foreground">
              Please provide details of a person who can be contacted in your home country in case of emergency.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="reference_home_name">Name *</Label>
              <Input
                id="reference_home_name"
                value={data.reference_home_name}
                onChange={(e) => updateData({ reference_home_name: e.target.value })}
                required
                maxLength={100}
                placeholder="Full name of reference person"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_home_address">Address *</Label>
              <Textarea
                id="reference_home_address"
                value={data.reference_home_address}
                onChange={(e) => updateData({ reference_home_address: e.target.value })}
                required
                maxLength={500}
                rows={2}
                placeholder="Full address in your home country"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_home_phone">Phone Number *</Label>
              <Input
                id="reference_home_phone"
                type="tel"
                value={data.reference_home_phone}
                onChange={(e) => updateData({ reference_home_phone: e.target.value })}
                required
                maxLength={20}
                placeholder="Phone number with country code"
                disabled={disabled}
              />
            </div>
          </div>

          {!disabled && (
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onBack} size="lg">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button type="submit" size="lg">
                Save & Continue
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default ReferencesTab;

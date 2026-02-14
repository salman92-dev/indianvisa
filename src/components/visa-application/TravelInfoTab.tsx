import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ApplicationData } from "@/types/visa-application";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

interface TravelInfoTabProps {
  data: ApplicationData;
  updateData: (updates: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
}

const TravelInfoTab = ({ data, updateData, onNext, onBack, disabled }: TravelInfoTabProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled) return;

    if (!data.indian_contact_address) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (data.visa_refused_before && !data.visa_refusal_details) {
      toast.error("Please provide details about previous visa refusal");
      return;
    }

    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Travel Information</CardTitle>
        <CardDescription>Details about your stay in India</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="indian_contact_address">Indian Contact Address (Hotel or Residence) *</Label>
            <Textarea
              id="indian_contact_address"
              value={data.indian_contact_address}
              onChange={(e) => updateData({ indian_contact_address: e.target.value })}
              required
              maxLength={500}
              rows={3}
              placeholder="Enter full address where you'll be staying in India"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="indian_contact_person">Contact Person in India (Name)</Label>
            <Input
              id="indian_contact_person"
              value={data.indian_contact_person || ""}
              onChange={(e) => updateData({ indian_contact_person: e.target.value })}
              maxLength={100}
              placeholder="Name of your contact in India (optional)"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="indian_contact_phone">Contact Person Phone Number</Label>
            <Input
              id="indian_contact_phone"
              type="tel"
              value={data.indian_contact_phone || ""}
              onChange={(e) => updateData({ indian_contact_phone: e.target.value })}
              maxLength={20}
              placeholder="+91 XXXXXXXXXX"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="previous_visa_details">Previous Visa Details (if any)</Label>
            <Textarea
              id="previous_visa_details"
              value={data.previous_visa_details || ""}
              onChange={(e) => updateData({ previous_visa_details: e.target.value })}
              maxLength={500}
              rows={3}
              placeholder="Previous Indian visa numbers, dates, etc. (optional)"
              disabled={disabled}
            />
          </div>

          <div className="space-y-4">
            <Label>Have you been refused a visa before? *</Label>
            <RadioGroup
              value={data.visa_refused_before ? "yes" : "no"}
              onValueChange={(value) => updateData({ visa_refused_before: value === "yes" })}
              disabled={disabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="refused-no" />
                <Label htmlFor="refused-no" className="font-normal cursor-pointer">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="refused-yes" />
                <Label htmlFor="refused-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
            </RadioGroup>
          </div>

          {data.visa_refused_before && (
            <div className="space-y-2">
              <Label htmlFor="visa_refusal_details">Provide Details about Visa Refusal *</Label>
              <Textarea
                id="visa_refusal_details"
                value={data.visa_refusal_details || ""}
                onChange={(e) => updateData({ visa_refusal_details: e.target.value })}
                required
                maxLength={500}
                rows={3}
                placeholder="Please provide details about when and why your visa was refused"
                disabled={disabled}
              />
            </div>
          )}

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

export default TravelInfoTab;
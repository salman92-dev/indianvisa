import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationData } from "@/types/visa-application";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import SearchableCountrySelect from "@/components/ui/SearchableCountrySelect";

interface ContactInfoTabProps {
  data: ApplicationData;
  updateData: (updates: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
}

const ContactInfoTab = ({ data, updateData, onNext, onBack, disabled }: ContactInfoTabProps) => {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled) return;

    if (!data.email || !data.residential_address || !data.city || !data.country) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>How we can reach you</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
              required
              maxLength={255}
              placeholder="Enter your email address"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Mobile Number</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={data.mobile_isd}
                disabled
                className="w-24 md:w-32 bg-muted shrink-0"
              />
              <Input
                type="tel"
                value={data.mobile_number}
                disabled
                className="flex-1 bg-muted"
              />
            </div>
            <p className="text-sm text-muted-foreground">Mobile number was provided in basic details</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="residential_address">Residential Address *</Label>
            <Textarea
              id="residential_address"
              value={data.residential_address}
              onChange={(e) => updateData({ residential_address: e.target.value })}
              required
              maxLength={500}
              rows={3}
              placeholder="Enter your full residential address"
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={data.city}
                onChange={(e) => updateData({ city: e.target.value })}
                required
                maxLength={100}
                placeholder="Enter your city"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Country *</Label>
              <SearchableCountrySelect 
                value={data.country} 
                onChange={(value) => updateData({ country: value })}
                placeholder="Select country"
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

export default ContactInfoTab;
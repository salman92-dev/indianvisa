import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplicationData } from "@/types/visa-application";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { ALL_COUNTRIES } from "@/lib/countryData";
import SearchableCountrySelect from "@/components/ui/SearchableCountrySelect";

interface AddressDetailsTabProps {
  data: ApplicationData;
  updateData: (updates: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
}

const AddressDetailsTab = ({ data, updateData, onNext, onBack, disabled }: AddressDetailsTabProps) => {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    // Validate present address
    if (!data.present_address_house_street || !data.present_address_village_town || 
        !data.present_address_state || !data.present_address_postal_code || !data.present_address_country) {
      toast.error("Please fill in all present address fields");
      return;
    }

    // Validate email and mobile
    if (!data.email || !data.mobile_number) {
      toast.error("Please provide email and mobile number");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate permanent address if different
    if (!data.permanent_address_same_as_present) {
      if (!data.permanent_address_house_street || !data.permanent_address_village_town || !data.permanent_address_state) {
        toast.error("Please fill in all permanent address fields");
        return;
      }
    }

    // Update legacy fields for compatibility
    updateData({
      residential_address: data.present_address_house_street,
      city: data.present_address_village_town,
      country: data.present_address_country
    });

    onNext();
  };

  const handleSameAddressChange = (checked: boolean) => {
    updateData({ permanent_address_same_as_present: checked });
    if (checked) {
      updateData({
        permanent_address_house_street: "",
        permanent_address_village_town: "",
        permanent_address_state: ""
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Address Details</CardTitle>
        <CardDescription>Your contact and address information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => updateData({ email: e.target.value })}
                required
                maxLength={255}
                placeholder="your.email@example.com"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Mobile Number *</Label>
              <div className="flex gap-2">
                <Select 
                  value={data.mobile_isd} 
                  onValueChange={(value) => updateData({ mobile_isd: value })}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-32 md:w-40 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {ALL_COUNTRIES.filter(c => c.isd).sort((a, b) => {
                      const aNum = parseInt(a.isd?.replace('+', '') || '0');
                      const bNum = parseInt(b.isd?.replace('+', '') || '0');
                      return aNum - bNum;
                    }).map((country) => (
                      <SelectItem key={country.code} value={country.isd || ""}>
                        {country.flag} {country.isd}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  value={data.mobile_number}
                  onChange={(e) => updateData({ mobile_number: e.target.value.replace(/[^0-9]/g, "") })}
                  placeholder="Mobile number"
                  required
                  maxLength={15}
                  className="flex-1"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          {/* Present Address */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">Present Address</h3>
            
            <div className="space-y-2">
              <Label htmlFor="present_address_house_street">House No./Street *</Label>
              <Input
                id="present_address_house_street"
                value={data.present_address_house_street}
                onChange={(e) => updateData({ present_address_house_street: e.target.value })}
                required
                maxLength={100}
                placeholder="House number and street name"
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="present_address_village_town">Village/Town/City *</Label>
                <Input
                  id="present_address_village_town"
                  value={data.present_address_village_town}
                  onChange={(e) => updateData({ present_address_village_town: e.target.value })}
                  required
                  maxLength={100}
                  placeholder="City or town name"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="present_address_state">State/Province/District *</Label>
                <Input
                  id="present_address_state"
                  value={data.present_address_state}
                  onChange={(e) => updateData({ present_address_state: e.target.value })}
                  required
                  maxLength={100}
                  placeholder="State or province"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="present_address_postal_code">Postal/Zip Code *</Label>
                <Input
                  id="present_address_postal_code"
                  value={data.present_address_postal_code}
                  onChange={(e) => updateData({ present_address_postal_code: e.target.value })}
                  required
                  maxLength={20}
                  placeholder="Postal code"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Country *</Label>
                <SearchableCountrySelect 
                  value={data.present_address_country} 
                  onChange={(value) => updateData({ present_address_country: value })}
                  placeholder="Select country"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="present_address_phone">Phone No. (Landline)</Label>
              <Input
                id="present_address_phone"
                type="tel"
                value={data.present_address_phone || ""}
                onChange={(e) => updateData({ present_address_phone: e.target.value })}
                maxLength={20}
                placeholder="Landline phone number (optional)"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Permanent Address */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Permanent Address</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="permanent_address_same"
                  checked={data.permanent_address_same_as_present}
                  onCheckedChange={handleSameAddressChange}
                  disabled={disabled}
                />
                <Label htmlFor="permanent_address_same" className="cursor-pointer text-sm">
                  Same as present address
                </Label>
              </div>
            </div>

            {!data.permanent_address_same_as_present && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="permanent_address_house_street">House No./Street *</Label>
                  <Input
                    id="permanent_address_house_street"
                    value={data.permanent_address_house_street || ""}
                    onChange={(e) => updateData({ permanent_address_house_street: e.target.value })}
                    maxLength={100}
                    placeholder="House number and street name"
                    disabled={disabled}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="permanent_address_village_town">Village/Town/City *</Label>
                    <Input
                      id="permanent_address_village_town"
                      value={data.permanent_address_village_town || ""}
                      onChange={(e) => updateData({ permanent_address_village_town: e.target.value })}
                      maxLength={100}
                      placeholder="City or town name"
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="permanent_address_state">State/Province/District *</Label>
                    <Input
                      id="permanent_address_state"
                      value={data.permanent_address_state || ""}
                      onChange={(e) => updateData({ permanent_address_state: e.target.value })}
                      maxLength={100}
                      placeholder="State or province"
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            )}
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

export default AddressDetailsTab;

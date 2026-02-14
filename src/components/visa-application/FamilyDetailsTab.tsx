import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ApplicationData, MARITAL_STATUSES } from "@/types/visa-application";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import SearchableCountrySelect from "@/components/ui/SearchableCountrySelect";

interface FamilyDetailsTabProps {
  data: ApplicationData;
  updateData: (updates: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
}

const FamilyDetailsTab = ({ data, updateData, onNext, onBack, disabled }: FamilyDetailsTabProps) => {
  const isMarried = data.marital_status === "Married";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    // Validate father's details
    if (!data.father_name || !data.father_nationality || !data.father_place_of_birth || !data.father_country_of_birth) {
      toast.error("Please fill in all father's details");
      return;
    }

    // Validate mother's details
    if (!data.mother_name || !data.mother_nationality || !data.mother_place_of_birth || !data.mother_country_of_birth) {
      toast.error("Please fill in all mother's details");
      return;
    }

    // Validate marital status
    if (!data.marital_status) {
      toast.error("Please select your marital status");
      return;
    }

    // Validate spouse details if married
    if (isMarried) {
      if (!data.spouse_name || !data.spouse_nationality || !data.spouse_place_of_birth || !data.spouse_country_of_birth) {
        toast.error("Please fill in spouse details");
        return;
      }
    }

    // Validate Pakistan heritage details if yes
    if (data.pakistan_heritage && !data.pakistan_heritage_details) {
      toast.error("Please provide details about Pakistan heritage");
      return;
    }

    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Details</CardTitle>
        <CardDescription>Information about your family members</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Father's Details */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">Father's Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="father_name">Name *</Label>
              <Input
                id="father_name"
                value={data.father_name}
                onChange={(e) => updateData({ father_name: e.target.value })}
                required
                maxLength={100}
                placeholder="Father's full name"
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nationality *</Label>
                <SearchableCountrySelect 
                  value={data.father_nationality} 
                  onChange={(value) => updateData({ father_nationality: value })}
                  placeholder="Select nationality"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Previous Nationality</Label>
                <SearchableCountrySelect 
                  value={data.father_prev_nationality || ""} 
                  onChange={(value) => updateData({ father_prev_nationality: value })}
                  placeholder="Select if different"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="father_place_of_birth">Place of Birth *</Label>
                <Input
                  id="father_place_of_birth"
                  value={data.father_place_of_birth}
                  onChange={(e) => updateData({ father_place_of_birth: e.target.value })}
                  required
                  maxLength={100}
                  placeholder="City/Town"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Country of Birth *</Label>
                <SearchableCountrySelect 
                  value={data.father_country_of_birth} 
                  onChange={(value) => updateData({ father_country_of_birth: value })}
                  placeholder="Select country"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          {/* Mother's Details */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">Mother's Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="mother_name">Name *</Label>
              <Input
                id="mother_name"
                value={data.mother_name}
                onChange={(e) => updateData({ mother_name: e.target.value })}
                required
                maxLength={100}
                placeholder="Mother's full name"
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nationality *</Label>
                <SearchableCountrySelect 
                  value={data.mother_nationality} 
                  onChange={(value) => updateData({ mother_nationality: value })}
                  placeholder="Select nationality"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Previous Nationality</Label>
                <SearchableCountrySelect 
                  value={data.mother_prev_nationality || ""} 
                  onChange={(value) => updateData({ mother_prev_nationality: value })}
                  placeholder="Select if different"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mother_place_of_birth">Place of Birth *</Label>
                <Input
                  id="mother_place_of_birth"
                  value={data.mother_place_of_birth}
                  onChange={(e) => updateData({ mother_place_of_birth: e.target.value })}
                  required
                  maxLength={100}
                  placeholder="City/Town"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Country of Birth *</Label>
                <SearchableCountrySelect 
                  value={data.mother_country_of_birth} 
                  onChange={(value) => updateData({ mother_country_of_birth: value })}
                  placeholder="Select country"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          {/* Marital Status */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">Marital Status</h3>
            
            <div className="space-y-2">
              <Label>Marital Status *</Label>
              <Select 
                value={data.marital_status} 
                onValueChange={(value) => updateData({ marital_status: value })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {MARITAL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Spouse Details - Only if married */}
            {isMarried && (
              <div className="space-y-4 pt-4 border-t mt-4">
                <h4 className="font-medium">Spouse Details</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="spouse_name">Spouse Name *</Label>
                  <Input
                    id="spouse_name"
                    value={data.spouse_name || ""}
                    onChange={(e) => updateData({ spouse_name: e.target.value })}
                    maxLength={100}
                    placeholder="Spouse's full name"
                    disabled={disabled}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nationality *</Label>
                    <SearchableCountrySelect 
                      value={data.spouse_nationality || ""} 
                      onChange={(value) => updateData({ spouse_nationality: value })}
                      placeholder="Select nationality"
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Previous Nationality</Label>
                    <SearchableCountrySelect 
                      value={data.spouse_prev_nationality || ""} 
                      onChange={(value) => updateData({ spouse_prev_nationality: value })}
                      placeholder="Select if different"
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spouse_place_of_birth">Place of Birth *</Label>
                    <Input
                      id="spouse_place_of_birth"
                      value={data.spouse_place_of_birth || ""}
                      onChange={(e) => updateData({ spouse_place_of_birth: e.target.value })}
                      maxLength={100}
                      placeholder="City/Town"
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Country of Birth *</Label>
                    <SearchableCountrySelect 
                      value={data.spouse_country_of_birth || ""} 
                      onChange={(value) => updateData({ spouse_country_of_birth: value })}
                      placeholder="Select country"
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pakistan Heritage Question */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <Label>Were your Parents/Grandparents (paternal/maternal) Pakistan Nationals or Belong to Pakistan held area? *</Label>
            <RadioGroup
              value={data.pakistan_heritage ? "yes" : "no"}
              onValueChange={(value) => updateData({ pakistan_heritage: value === "yes" })}
              disabled={disabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="pakistan-no" />
                <Label htmlFor="pakistan-no" className="font-normal cursor-pointer">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="pakistan-yes" />
                <Label htmlFor="pakistan-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
            </RadioGroup>

            {data.pakistan_heritage && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="pakistan_heritage_details">Please provide details *</Label>
                <Textarea
                  id="pakistan_heritage_details"
                  value={data.pakistan_heritage_details || ""}
                  onChange={(e) => updateData({ pakistan_heritage_details: e.target.value })}
                  maxLength={500}
                  rows={3}
                  placeholder="Provide details about Pakistan heritage"
                  disabled={disabled}
                />
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

export default FamilyDetailsTab;

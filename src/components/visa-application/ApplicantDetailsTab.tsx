import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationData, RELIGIONS, EDUCATION_QUALIFICATIONS } from "@/types/visa-application";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import SearchableCountrySelect from "@/components/ui/SearchableCountrySelect";

interface ApplicantDetailsTabProps {
  data: ApplicationData;
  updateData: (updates: Partial<ApplicationData>) => void;
  onNext: () => void;
  disabled?: boolean;
}

const ApplicantDetailsTab = ({ data, updateData, onNext, disabled }: ApplicantDetailsTabProps) => {
  const [dobYear, setDobYear] = useState<number>(data.date_of_birth ? new Date(data.date_of_birth).getFullYear() : new Date().getFullYear() - 30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    // Validate required fields
    if (!data.surname || !data.given_name || !data.date_of_birth || !data.gender || 
        !data.place_of_birth || !data.country_of_birth || !data.citizenship_id ||
        !data.religion || !data.visible_identification_marks || !data.educational_qualification ||
        !data.nationality) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Update full_name from surname + given_name
    updateData({ full_name: `${data.surname} ${data.given_name}`.trim() });
    onNext();
  };

  const generateYearOptions = (startYear: number, endYear: number) => {
    const years = [];
    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applicant Details</CardTitle>
        <CardDescription>Personal information as per your passport</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surname">Surname (exactly as in passport) *</Label>
              <Input
                id="surname"
                value={data.surname}
                onChange={(e) => updateData({ surname: e.target.value.toUpperCase() })}
                required
                maxLength={50}
                placeholder="SURNAME"
                disabled={disabled}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="given_name">Given Name(s) (exactly as in passport) *</Label>
              <Input
                id="given_name"
                value={data.given_name}
                onChange={(e) => updateData({ given_name: e.target.value.toUpperCase() })}
                required
                maxLength={100}
                placeholder="GIVEN NAMES"
                disabled={disabled}
                className="uppercase"
              />
            </div>
          </div>

          {/* Changed Name */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="changed_name"
                checked={data.changed_name}
                onCheckedChange={(checked) => updateData({ changed_name: !!checked })}
                disabled={disabled}
              />
              <Label htmlFor="changed_name" className="cursor-pointer">
                Have you ever changed your name?
              </Label>
            </div>
            {data.changed_name && (
              <div className="space-y-2">
                <Label htmlFor="changed_name_details">Previous Name Details *</Label>
                <Input
                  id="changed_name_details"
                  value={data.changed_name_details || ""}
                  onChange={(e) => updateData({ changed_name_details: e.target.value })}
                  placeholder="Enter your previous name"
                  disabled={disabled}
                />
              </div>
            )}
          </div>

          {/* DOB and Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.date_of_birth && "text-muted-foreground"
                    )}
                    disabled={disabled}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{data.date_of_birth ? format(new Date(data.date_of_birth), "PPP") : "Select date"}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex items-center justify-between p-2 border-b">
                    <Button variant="ghost" size="icon" onClick={() => setDobYear(dobYear - 1)} disabled={dobYear <= 1900}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Select value={dobYear.toString()} onValueChange={(v) => setDobYear(parseInt(v))}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {generateYearOptions(1900, new Date().getFullYear()).map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => setDobYear(dobYear + 1)} disabled={dobYear >= new Date().getFullYear()}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Calendar
                    mode="single"
                    selected={data.date_of_birth ? new Date(data.date_of_birth) : undefined}
                    onSelect={(date) => date && updateData({ date_of_birth: format(date, "yyyy-MM-dd") })}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    month={new Date(dobYear, data.date_of_birth ? new Date(data.date_of_birth).getMonth() : 0)}
                    onMonthChange={(date) => setDobYear(date.getFullYear())}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select 
                value={data.gender} 
                onValueChange={(value) => updateData({ gender: value as "male" | "female" | "other" })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Birth Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="place_of_birth">Town/City of Birth *</Label>
              <Input
                id="place_of_birth"
                value={data.place_of_birth}
                onChange={(e) => updateData({ place_of_birth: e.target.value })}
                required
                maxLength={100}
                placeholder="City/Town of birth"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label>Country of Birth *</Label>
              <SearchableCountrySelect 
                value={data.country_of_birth} 
                onChange={(value) => updateData({ country_of_birth: value })}
                placeholder="Select country"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Citizenship ID */}
          <div className="space-y-2">
            <Label htmlFor="citizenship_id">Citizenship/National ID No. *</Label>
            <Input
              id="citizenship_id"
              value={data.citizenship_id}
              onChange={(e) => updateData({ citizenship_id: e.target.value })}
              required
              maxLength={50}
              placeholder="Enter ID number (or NA if not applicable)"
              disabled={disabled}
            />
          </div>

          {/* Religion and Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Religion *</Label>
              <Select 
                value={data.religion} 
                onValueChange={(value) => updateData({ religion: value })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select religion" />
                </SelectTrigger>
                <SelectContent>
                  {RELIGIONS.map((religion) => (
                    <SelectItem key={religion} value={religion}>{religion}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Educational Qualification *</Label>
              <Select 
                value={data.educational_qualification} 
                onValueChange={(value) => updateData({ educational_qualification: value })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select qualification" />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_QUALIFICATIONS.map((qual) => (
                    <SelectItem key={qual} value={qual}>{qual}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visible Identification Marks */}
          <div className="space-y-2">
            <Label htmlFor="visible_identification_marks">Visible Identification Marks (exactly as in passport, if any) *</Label>
            <Input
              id="visible_identification_marks"
              value={data.visible_identification_marks}
              onChange={(e) => updateData({ visible_identification_marks: e.target.value })}
              required
              maxLength={200}
              placeholder="e.g., Mole on left cheek, Scar on right hand, or None"
              disabled={disabled}
            />
          </div>

          {/* Nationality */}
          <div className="space-y-2">
            <Label>Nationality *</Label>
            <SearchableCountrySelect 
              value={data.nationality} 
              onChange={(value) => updateData({ nationality: value })}
              placeholder="Select nationality"
              disabled={disabled}
            />
          </div>

          {/* Nationality Questions */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label>Did you acquire nationality by birth or by naturalization? *</Label>
              <Select 
                value={data.nationality_by_birth ? "birth" : "naturalization"} 
                onValueChange={(value) => updateData({ nationality_by_birth: value === "birth" })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="birth">By Birth</SelectItem>
                  <SelectItem value="naturalization">By Naturalization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Have you lived for at least two years in the country where you are applying for visa? *</Label>
              <Select 
                value={data.lived_in_applying_country_2_years ? "yes" : "no"} 
                onValueChange={(value) => updateData({ lived_in_applying_country_2_years: value === "yes" })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!disabled && (
            <div className="flex justify-end pt-4">
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

export default ApplicantDetailsTab;

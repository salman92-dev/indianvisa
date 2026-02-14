import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationData } from "@/types/visa-application";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

// Regional options for nationality
const NATIONALITY_REGIONS = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'EU', name: 'European Union' },
  { code: 'ROW', name: 'Rest of World' },
];

interface BasicInfoTabProps {
  data: ApplicationData;
  updateData: (updates: Partial<ApplicationData>) => void;
  onNext: () => void;
  disabled?: boolean;
}

const BasicInfoTab = ({ data, updateData, onNext, disabled }: BasicInfoTabProps) => {
  const [dobMonth, setDobMonth] = useState<Date>(data.date_of_birth ? new Date(data.date_of_birth) : new Date(new Date().getFullYear() - 30, 0, 1));
  const [issueMonth, setIssueMonth] = useState<Date>(data.passport_issue_date ? new Date(data.passport_issue_date) : new Date());
  const [expiryMonth, setExpiryMonth] = useState<Date>(data.passport_expiry_date ? new Date(data.passport_expiry_date) : new Date(new Date().getFullYear() + 5, 0, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled) return;

    // Validate required fields
    if (!data.full_name || !data.date_of_birth || !data.gender || !data.nationality || 
        !data.passport_number || !data.passport_issue_date || !data.passport_expiry_date ||
        !data.place_of_birth || !data.country_of_birth || !data.mobile_isd || !data.mobile_number) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate mobile number
    if (data.mobile_number.length < 7 || data.mobile_number.length > 15) {
      toast.error("Please enter a valid mobile number (7-15 digits)");
      return;
    }

    // Validate passport expiry
    const issueDate = new Date(data.passport_issue_date);
    const expiryDate = new Date(data.passport_expiry_date);
    if (expiryDate <= issueDate) {
      toast.error("Passport expiry date must be after issue date");
      return;
    }

    onNext();
  };

  const SimpleDatePicker = ({ 
    value, 
    onChange, 
    label, 
    disabledFn,
    calendarMonth,
    onMonthChange
  }: { 
    value: string;
    onChange: (date: string) => void;
    label: string;
    disabledFn: (date: Date) => boolean;
    calendarMonth: Date;
    onMonthChange: (date: Date) => void;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{value ? format(new Date(value), "PPP") : `Select ${label.toLowerCase()}`}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => date && onChange(format(date, "yyyy-MM-dd"))}
          disabled={disabledFn}
          month={calendarMonth}
          onMonthChange={onMonthChange}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Personal Information</CardTitle>
        <CardDescription>As per your passport</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name (as per passport) *</Label>
            <Input
              id="full_name"
              value={data.full_name}
              onChange={(e) => updateData({ full_name: e.target.value })}
              required
              maxLength={100}
              placeholder="Enter your full name"
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <SimpleDatePicker
                value={data.date_of_birth}
                onChange={(date) => updateData({ date_of_birth: date })}
                label="date of birth"
                disabledFn={(date) => date > new Date() || date < new Date("1900-01-01")}
                calendarMonth={dobMonth}
                onMonthChange={setDobMonth}
              />
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

          <div className="space-y-2">
            <Label>Nationality *</Label>
            <Select 
              value={data.nationality} 
              onValueChange={(value) => updateData({ nationality: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select nationality" />
              </SelectTrigger>
              <SelectContent>
                {NATIONALITY_REGIONS.map((region) => (
                  <SelectItem key={region.code} value={region.code}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passport_number">Passport Number *</Label>
            <Input
              id="passport_number"
              value={data.passport_number}
              onChange={(e) => updateData({ passport_number: e.target.value.toUpperCase() })}
              required
              maxLength={20}
              placeholder="Enter passport number"
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Passport Issue Date *</Label>
              <SimpleDatePicker
                value={data.passport_issue_date}
                onChange={(date) => updateData({ passport_issue_date: date })}
                label="issue date"
                disabledFn={(date) => date > new Date()}
                calendarMonth={issueMonth}
                onMonthChange={setIssueMonth}
              />
            </div>

            <div className="space-y-2">
              <Label>Passport Expiry Date *</Label>
              <SimpleDatePicker
                value={data.passport_expiry_date}
                onChange={(date) => updateData({ passport_expiry_date: date })}
                label="expiry date"
                disabledFn={(date) => date < new Date()}
                calendarMonth={expiryMonth}
                onMonthChange={setExpiryMonth}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="place_of_birth">Place of Birth *</Label>
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
              <Select 
                value={data.country_of_birth} 
                onValueChange={(value) => updateData({ country_of_birth: value })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {NATIONALITY_REGIONS.map((region) => (
                    <SelectItem key={region.code} value={region.code}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                <SelectContent>
                  <SelectItem value="+1">+1 (US)</SelectItem>
                  <SelectItem value="+44">+44 (UK)</SelectItem>
                  <SelectItem value="+33">+33 (FR)</SelectItem>
                  <SelectItem value="+49">+49 (DE)</SelectItem>
                  <SelectItem value="+971">+971 (UAE)</SelectItem>
                  <SelectItem value="+91">+91 (IN)</SelectItem>
                  <SelectItem value="+92">+92 (PK)</SelectItem>
                  <SelectItem value="+880">+880 (BD)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="tel"
                value={data.mobile_number}
                onChange={(e) => updateData({ mobile_number: e.target.value.replace(/[^0-9]/g, "") })}
                placeholder="Enter mobile number"
                required
                maxLength={15}
                className="flex-1"
                disabled={disabled}
              />
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

export default BasicInfoTab;
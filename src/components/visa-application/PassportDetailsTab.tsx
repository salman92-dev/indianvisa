import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplicationData } from "@/types/visa-application";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import SearchableCountrySelect from "@/components/ui/SearchableCountrySelect";

interface PassportDetailsTabProps {
  data: ApplicationData;
  updateData: (updates: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
}

const PassportDetailsTab = ({ data, updateData, onNext, onBack, disabled }: PassportDetailsTabProps) => {
  const [issueMonth, setIssueMonth] = useState<Date>(data.passport_issue_date ? new Date(data.passport_issue_date) : new Date());
  const [expiryMonth, setExpiryMonth] = useState<Date>(data.passport_expiry_date ? new Date(data.passport_expiry_date) : new Date(new Date().getFullYear() + 5, 0, 1));
  const [otherIssueMonth, setOtherIssueMonth] = useState<Date>(data.other_passport_issue_date ? new Date(data.other_passport_issue_date) : new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    if (!data.passport_number || !data.passport_place_of_issue || !data.passport_issue_date || !data.passport_expiry_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate passport expiry
    const issueDate = new Date(data.passport_issue_date);
    const expiryDate = new Date(data.passport_expiry_date);
    if (expiryDate <= issueDate) {
      toast.error("Passport expiry date must be after issue date");
      return;
    }

    // Validate other passport if held
    if (data.other_passport_held) {
      if (!data.other_passport_country || !data.other_passport_number || !data.other_passport_issue_date || 
          !data.other_passport_place_of_issue || !data.other_passport_nationality) {
        toast.error("Please fill in all other passport details");
        return;
      }
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
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
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
        <CardTitle>Passport Details</CardTitle>
        <CardDescription>Your passport information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Passport Details */}
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
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passport_place_of_issue">Place of Issue *</Label>
            <Input
              id="passport_place_of_issue"
              value={data.passport_place_of_issue}
              onChange={(e) => updateData({ passport_place_of_issue: e.target.value })}
              required
              maxLength={100}
              placeholder="City/Place where passport was issued"
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Issue *</Label>
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
              <Label>Date of Expiry *</Label>
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

          {/* Other Passport Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="other_passport_held"
                checked={data.other_passport_held}
                onCheckedChange={(checked) => updateData({ other_passport_held: !!checked })}
                disabled={disabled}
              />
              <Label htmlFor="other_passport_held" className="cursor-pointer">
                Do you hold any other valid Passport/Identity Certificate?
              </Label>
            </div>

            {data.other_passport_held && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Country of Issue *</Label>
                  <SearchableCountrySelect 
                    value={data.other_passport_country || ""} 
                    onChange={(value) => updateData({ other_passport_country: value })}
                    placeholder="Select country"
                    disabled={disabled}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="other_passport_number">Passport/IC Number *</Label>
                    <Input
                      id="other_passport_number"
                      value={data.other_passport_number || ""}
                      onChange={(e) => updateData({ other_passport_number: e.target.value.toUpperCase() })}
                      maxLength={20}
                      placeholder="Enter passport/IC number"
                      disabled={disabled}
                      className="uppercase"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date of Issue *</Label>
                    <SimpleDatePicker
                      value={data.other_passport_issue_date || ""}
                      onChange={(date) => updateData({ other_passport_issue_date: date })}
                      label="issue date"
                      disabledFn={(date) => date > new Date()}
                      calendarMonth={otherIssueMonth}
                      onMonthChange={setOtherIssueMonth}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="other_passport_place_of_issue">Place of Issue *</Label>
                  <Input
                    id="other_passport_place_of_issue"
                    value={data.other_passport_place_of_issue || ""}
                    onChange={(e) => updateData({ other_passport_place_of_issue: e.target.value })}
                    maxLength={100}
                    placeholder="Place where passport/IC was issued"
                    disabled={disabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nationality Mentioned Therein *</Label>
                  <SearchableCountrySelect 
                    value={data.other_passport_nationality || ""} 
                    onChange={(value) => updateData({ other_passport_nationality: value })}
                    placeholder="Select nationality"
                    disabled={disabled}
                  />
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

export default PassportDetailsTab;

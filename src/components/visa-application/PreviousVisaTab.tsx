import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ApplicationData, VISA_TYPES_PREVIOUS, SAARC_COUNTRIES } from "@/types/visa-application";
import { toast } from "sonner";
import { ChevronLeft, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import CountriesVisitedInput from "./CountriesVisitedInput";

interface PreviousVisaTabProps {
  data: ApplicationData;
  updateData: (updates: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
}

const PreviousVisaTab = ({ data, updateData, onNext, onBack, disabled }: PreviousVisaTabProps) => {
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    data.previous_visa_issue_date 
      ? new Date(data.previous_visa_issue_date) 
      : new Date(new Date().getFullYear() - 1, 0, 1)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    // Validate previous India visit details if visited before
    if (data.visited_india_before) {
      if (!data.previous_india_address || !data.previous_india_cities || !data.previous_visa_number ||
          !data.previous_visa_type || !data.previous_visa_place_of_issue || !data.previous_visa_issue_date) {
        toast.error("Please fill in all previous India visit details");
        return;
      }
    }

    // Validate permission refused details
    if (data.permission_refused_before && !data.permission_refused_details) {
      toast.error("Please provide details about permission refusal");
      return;
    }

    // Validate SAARC details
    if (data.visited_saarc_countries && !data.saarc_countries_details) {
      toast.error("Please provide details about SAARC country visits");
      return;
    }

    // Update legacy field
    updateData({ 
      visa_refused_before: data.permission_refused_before,
      visa_refusal_details: data.permission_refused_details,
      previous_visa_details: data.previous_visa_number 
        ? `Visa No: ${data.previous_visa_number}, Type: ${data.previous_visa_type}, Cities: ${data.previous_india_cities}`
        : ""
    });

    onNext();
  };


  // Convert string array to country visit objects for component
  const countriesVisitedData = useMemo(() => {
    const arr = data.countries_visited_last_10_years || [];
    return arr.map(item => {
      // If it's already in "Country - Year" format, parse it
      if (item.includes(" - ")) {
        const [country, year] = item.split(" - ");
        return { country: country.trim(), year: year?.trim() || "" };
      }
      return { country: item, year: "" };
    });
  }, [data.countries_visited_last_10_years]);

  const handleCountriesVisitedChange = (visits: { country: string; year: string }[]) => {
    // Store as "Country - Year" format or just country if no year
    const formatted = visits
      .filter(v => v.country.trim())
      .map(v => v.year ? `${v.country} - ${v.year}` : v.country);
    updateData({ countries_visited_last_10_years: formatted });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Previous Visa & Travel History</CardTitle>
        <CardDescription>Information about your previous visits and travel</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Previous India Visit */}
          <div className="space-y-4 p-4 border rounded-lg">
            <Label className="text-base font-semibold">Have you ever visited India before? *</Label>
            <RadioGroup
              value={data.visited_india_before ? "yes" : "no"}
              onValueChange={(value) => updateData({ visited_india_before: value === "yes" })}
              disabled={disabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="visited-no" />
                <Label htmlFor="visited-no" className="font-normal cursor-pointer">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="visited-yes" />
                <Label htmlFor="visited-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
            </RadioGroup>

            {data.visited_india_before && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="previous_india_address">Address where you stayed *</Label>
                  <Textarea
                    id="previous_india_address"
                    value={data.previous_india_address || ""}
                    onChange={(e) => updateData({ previous_india_address: e.target.value })}
                    maxLength={500}
                    rows={2}
                    placeholder="Full address of previous stay in India"
                    disabled={disabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previous_india_cities">Cities Visited in India *</Label>
                  <Input
                    id="previous_india_cities"
                    value={data.previous_india_cities || ""}
                    onChange={(e) => updateData({ previous_india_cities: e.target.value })}
                    maxLength={200}
                    placeholder="e.g., New Delhi, Mumbai, Agra (comma separated)"
                    disabled={disabled}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="previous_visa_number">Last Indian Visa Number *</Label>
                    <Input
                      id="previous_visa_number"
                      value={data.previous_visa_number || ""}
                      onChange={(e) => updateData({ previous_visa_number: e.target.value.toUpperCase() })}
                      maxLength={50}
                      placeholder="Visa number"
                      disabled={disabled}
                      className="uppercase"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type of Visa *</Label>
                    <Select 
                      value={data.previous_visa_type || ""} 
                      onValueChange={(value) => updateData({ previous_visa_type: value })}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select visa type" />
                      </SelectTrigger>
                      <SelectContent>
                        {VISA_TYPES_PREVIOUS.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="previous_visa_place_of_issue">Place of Issue *</Label>
                    <Input
                      id="previous_visa_place_of_issue"
                      value={data.previous_visa_place_of_issue || ""}
                      onChange={(e) => updateData({ previous_visa_place_of_issue: e.target.value })}
                      maxLength={100}
                      placeholder="City/Country where visa was issued"
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date of Issue *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !data.previous_visa_issue_date && "text-muted-foreground"
                          )}
                          disabled={disabled}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {data.previous_visa_issue_date 
                              ? format(new Date(data.previous_visa_issue_date), "PPP") 
                              : "Select date"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={data.previous_visa_issue_date ? new Date(data.previous_visa_issue_date) : undefined}
                          onSelect={(date) => date && updateData({ previous_visa_issue_date: format(date, "yyyy-MM-dd") })}
                          disabled={(date) => date > new Date()}
                          month={calendarMonth}
                          onMonthChange={setCalendarMonth}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Permission Refused */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <Label className="text-base font-semibold">
              Has permission to visit or to extend stay in India previously been refused? *
            </Label>
            <RadioGroup
              value={data.permission_refused_before ? "yes" : "no"}
              onValueChange={(value) => updateData({ permission_refused_before: value === "yes" })}
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

            {data.permission_refused_before && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="permission_refused_details">
                  Please provide details (when, by whom, Control No. and date) *
                </Label>
                <Textarea
                  id="permission_refused_details"
                  value={data.permission_refused_details || ""}
                  onChange={(e) => updateData({ permission_refused_details: e.target.value })}
                  maxLength={500}
                  rows={3}
                  placeholder="Provide complete details about the refusal"
                  disabled={disabled}
                />
              </div>
            )}
          </div>

          {/* Countries Visited */}
          <div className="space-y-4 p-4 border rounded-lg">
            <Label className="text-base font-semibold">Countries Visited in Last 10 Years</Label>
            <p className="text-sm text-muted-foreground">
              Enter countries you have visited in the last 10 years (if information is found incorrect, you may be refused entry).
            </p>
            <CountriesVisitedInput
              value={countriesVisitedData}
              onChange={handleCountriesVisitedChange}
              disabled={disabled}
            />
          </div>

          {/* SAARC Countries */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <Label className="text-base font-semibold">
              Have you visited SAARC countries (except your own country) during last 3 years? *
            </Label>
            <p className="text-sm text-muted-foreground">
              SAARC Countries: {SAARC_COUNTRIES.join(", ")}
            </p>
            <RadioGroup
              value={data.visited_saarc_countries ? "yes" : "no"}
              onValueChange={(value) => updateData({ visited_saarc_countries: value === "yes" })}
              disabled={disabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="saarc-no" />
                <Label htmlFor="saarc-no" className="font-normal cursor-pointer">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="saarc-yes" />
                <Label htmlFor="saarc-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
            </RadioGroup>

            {data.visited_saarc_countries && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="saarc_countries_details">Please provide details (countries and year) *</Label>
                <Textarea
                  id="saarc_countries_details"
                  value={data.saarc_countries_details || ""}
                  onChange={(e) => updateData({ saarc_countries_details: e.target.value })}
                  maxLength={500}
                  rows={3}
                  placeholder="e.g., Pakistan - 2022, Nepal - 2023"
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

export default PreviousVisaTab;

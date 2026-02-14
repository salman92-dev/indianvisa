import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationData } from "@/types/visa-application";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VisaDetailsTabProps {
  data: ApplicationData;
  updateData: (updates: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
}

const VisaDetailsTab = ({ data, updateData, onNext, onBack, disabled }: VisaDetailsTabProps) => {
  const [arrivalPoints, setArrivalPoints] = useState<any[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    data.intended_arrival_date 
      ? new Date(data.intended_arrival_date) 
      : new Date()
  );

  useEffect(() => {
    loadArrivalPoints();
  }, []);

  const loadArrivalPoints = async () => {
    const { data: points } = await supabase
      .from("arrival_points")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (points) setArrivalPoints(points);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled) return;

    if (!data.visa_type || !data.duration_of_stay || !data.intended_arrival_date || !data.arrival_point_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (data.visa_type === "other" && !data.visa_type_other) {
      toast.error("Please specify the visa type");
      return;
    }

    onNext();
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Visa Details</CardTitle>
        <CardDescription>Information about your visa requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Visa Type *</Label>
            <Select 
              value={data.visa_type} 
              onValueChange={(value) => updateData({ visa_type: value as "tourist" | "business" | "medical" | "conference" | "student" | "other" })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visa type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tourist">Tourist</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {data.visa_type === "other" && (
            <div className="space-y-2">
              <Label htmlFor="visa_type_other">Specify Visa Type *</Label>
              <Input
                id="visa_type_other"
                value={data.visa_type_other || ""}
                onChange={(e) => updateData({ visa_type_other: e.target.value })}
                required
                maxLength={100}
                placeholder="Enter visa type"
                disabled={disabled}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Duration of Stay *</Label>
            <Select 
              value={data.duration_of_stay} 
              onValueChange={(value) => updateData({ duration_of_stay: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30 days">30 Days</SelectItem>
                <SelectItem value="60 days">60 Days</SelectItem>
                <SelectItem value="90 days">90 Days</SelectItem>
                <SelectItem value="1 year">1 Year</SelectItem>
                <SelectItem value="5 years">5 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Intended Date of Arrival in India *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.intended_arrival_date && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {data.intended_arrival_date ? format(new Date(data.intended_arrival_date), "PPP") : "Select arrival date"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.intended_arrival_date ? new Date(data.intended_arrival_date) : undefined}
                  onSelect={(date) => date && updateData({ intended_arrival_date: format(date, "yyyy-MM-dd") })}
                  disabled={(date) => date < new Date()}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Arrival Airport/Seaport in India *</Label>
            <Select 
              value={data.arrival_point_id} 
              onValueChange={(value) => updateData({ arrival_point_id: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select arrival point" />
              </SelectTrigger>
              <SelectContent>
                {arrivalPoints.map((point) => (
                  <SelectItem key={point.id} value={point.id}>
                    {point.name} ({point.code}) - {point.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose_of_visit">Purpose of Visit</Label>
            <Textarea
              id="purpose_of_visit"
              value={data.purpose_of_visit || ""}
              onChange={(e) => updateData({ purpose_of_visit: e.target.value })}
              maxLength={500}
              rows={3}
              placeholder="Briefly describe your purpose of visit (optional)"
              disabled={disabled}
            />
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

export default VisaDetailsTab;
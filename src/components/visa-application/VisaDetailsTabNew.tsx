import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplicationData } from "@/types/visa-application";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VisaDetailsTabNewProps {
  data: ApplicationData;
  updateData: (updates: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
}

const VisaDetailsTabNew = ({ data, updateData, onNext, onBack, disabled }: VisaDetailsTabNewProps) => {
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

    if (!data.places_to_visit_1) {
      toast.error("Please enter at least one place to visit");
      return;
    }

    if (data.hotel_booked_through_operator && (!data.hotel_name || !data.hotel_address)) {
      toast.error("Please provide hotel details");
      return;
    }

    // Update legacy field
    updateData({ indian_contact_address: data.hotel_address || data.places_to_visit_1 || "" });

    onNext();
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Visa Details</CardTitle>
        <CardDescription>Information about your visa and travel plans</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Visa Type & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Visa Type *</Label>
              <Select 
                value={data.visa_type} 
                onValueChange={(value) => updateData({ visa_type: value as any })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visa type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tourist">e-Tourist Visa</SelectItem>
                  <SelectItem value="business">e-Business Visa</SelectItem>
                  <SelectItem value="medical">e-Medical Visa</SelectItem>
                  <SelectItem value="conference">e-Conference Visa</SelectItem>
                  <SelectItem value="student">Student Visa</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration of Visa *</Label>
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
                  <SelectItem value="1 year">1 Year (365 Days)</SelectItem>
                  <SelectItem value="5 years">5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Places to Visit */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Places to Visit in India</h3>
            <p className="text-sm text-muted-foreground">
              If you intend to visit Protected/Restricted/Cantonment areas, you would require prior permission from the Civil Authority.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="places_to_visit_1">Place 1 *</Label>
                <Input
                  id="places_to_visit_1"
                  value={data.places_to_visit_1 || ""}
                  onChange={(e) => updateData({ places_to_visit_1: e.target.value })}
                  maxLength={100}
                  placeholder="e.g., New Delhi, Mumbai"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="places_to_visit_2">Place 2</Label>
                <Input
                  id="places_to_visit_2"
                  value={data.places_to_visit_2 || ""}
                  onChange={(e) => updateData({ places_to_visit_2: e.target.value })}
                  maxLength={100}
                  placeholder="e.g., Agra, Jaipur"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          {/* Hotel Booking */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hotel_booked"
                checked={data.hotel_booked_through_operator}
                onCheckedChange={(checked) => updateData({ hotel_booked_through_operator: !!checked })}
                disabled={disabled}
              />
              <Label htmlFor="hotel_booked" className="cursor-pointer">
                Have you booked any room in Hotel/Resort through any Tour Operator?
              </Label>
            </div>

            {data.hotel_booked_through_operator && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="hotel_name">Hotel/Resort Name *</Label>
                  <Input
                    id="hotel_name"
                    value={data.hotel_name || ""}
                    onChange={(e) => updateData({ hotel_name: e.target.value })}
                    maxLength={200}
                    placeholder="Name of hotel or resort"
                    disabled={disabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hotel_address">Hotel Address *</Label>
                  <Textarea
                    id="hotel_address"
                    value={data.hotel_address || ""}
                    onChange={(e) => updateData({ hotel_address: e.target.value })}
                    maxLength={500}
                    rows={2}
                    placeholder="Full address of hotel"
                    disabled={disabled}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Travel Dates & Ports */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Expected Date of Arrival *</Label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Port of Arrival in India *</Label>
                <Select 
                  value={data.arrival_point_id} 
                  onValueChange={(value) => updateData({ arrival_point_id: value })}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select arrival point" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {arrivalPoints.map((point) => (
                      <SelectItem key={point.id} value={point.id}>
                        {point.name} ({point.code}) - {point.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expected Port of Exit from India</Label>
                <Select 
                  value={data.expected_port_of_exit || ""} 
                  onValueChange={(value) => updateData({ expected_port_of_exit: value })}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exit point (optional)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {arrivalPoints.map((point) => (
                      <SelectItem key={point.id} value={point.id}>
                        {point.name} ({point.code}) - {point.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Purpose of Visit */}
          <div className="space-y-2">
            <Label htmlFor="purpose_of_visit">Purpose of Visit</Label>
            <Textarea
              id="purpose_of_visit"
              value={data.purpose_of_visit || ""}
              onChange={(e) => updateData({ purpose_of_visit: e.target.value })}
              maxLength={500}
              rows={3}
              placeholder="e.g., Recreation/Sight-seeing, Business meetings, etc."
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

export default VisaDetailsTabNew;

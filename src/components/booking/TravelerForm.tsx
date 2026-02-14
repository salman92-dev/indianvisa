import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SearchableCountrySelect from "@/components/ui/SearchableCountrySelect";
import { ALL_COUNTRIES } from "@/lib/countryData";

export interface TravelerData {
  id: string;
  full_name: string;
  passport_number: string;
  date_of_birth: string;
  dob_day: string;
  dob_month: string;
  dob_year: string;
  gender: string;
  nationality: string;
  email: string;
  phone: string;
}

interface TravelerFormProps {
  index: number;
  traveler: TravelerData;
  defaultNationality: string;
  defaultEmail: string;
  defaultPhone: string;
  isExpanded: boolean;
  canDelete: boolean;
  onToggle: () => void;
  onUpdate: (data: TravelerData) => void;
  onDelete: () => void;
}

// Generate arrays for date pickers
const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

const TravelerForm = ({
  index,
  traveler,
  defaultNationality,
  defaultEmail,
  defaultPhone,
  isExpanded,
  canDelete,
  onToggle,
  onUpdate,
  onDelete,
}: TravelerFormProps) => {
  const updateField = (field: keyof TravelerData, value: string) => {
    const updated = { ...traveler, [field]: value };
    
    // Combine date fields when any date part changes
    if (field === 'dob_day' || field === 'dob_month' || field === 'dob_year') {
      const day = field === 'dob_day' ? value : updated.dob_day;
      const month = field === 'dob_month' ? value : updated.dob_month;
      const year = field === 'dob_year' ? value : updated.dob_year;
      if (day && month && year) {
        updated.date_of_birth = `${year}-${month}-${day}`;
      }
    }
    
    onUpdate(updated);
  };

  const isComplete = 
    traveler.full_name.trim() && 
    traveler.passport_number.trim() && 
    traveler.dob_day && 
    traveler.dob_month && 
    traveler.dob_year && 
    traveler.gender && 
    traveler.nationality;

  // Get the display name for nationality
  const nationalityDisplay = traveler.nationality || defaultNationality;
  const selectedCountry = ALL_COUNTRIES.find(c => c.code === nationalityDisplay);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="border rounded-lg bg-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <div className="text-left">
                <div className="font-medium">
                  {traveler.full_name || `Traveler ${index + 1}`}
                </div>
                {traveler.passport_number && (
                  <div className="text-sm text-muted-foreground">
                    Passport: {traveler.passport_number}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isComplete && (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4 border-t">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor={`name-${index}`}>Full Name (as in passport) *</Label>
              <Input
                id={`name-${index}`}
                value={traveler.full_name}
                onChange={(e) => updateField('full_name', e.target.value)}
                placeholder="Enter full name"
                className="uppercase"
              />
            </div>

            {/* Passport Number */}
            <div className="space-y-2">
              <Label htmlFor={`passport-${index}`}>Passport Number *</Label>
              <Input
                id={`passport-${index}`}
                value={traveler.passport_number}
                onChange={(e) => updateField('passport_number', e.target.value.toUpperCase())}
                placeholder="Enter passport number"
                className="uppercase"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={traveler.dob_day}
                  onValueChange={(value) => updateField('dob_day', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={traveler.dob_month}
                  onValueChange={(value) => updateField('dob_month', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={traveler.dob_year}
                  onValueChange={(value) => updateField('dob_year', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select
                value={traveler.gender}
                onValueChange={(value) => updateField('gender', value)}
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

            {/* Nationality */}
            <div className="space-y-2">
              <Label>Nationality *</Label>
              <SearchableCountrySelect
                value={traveler.nationality || defaultNationality}
                onChange={(value) => updateField('nationality', value)}
                placeholder="Select nationality"
                valueType="code"
              />
            </div>

            {/* Email (optional) */}
            <div className="space-y-2">
              <Label htmlFor={`email-${index}`}>
                Email <span className="text-muted-foreground text-xs">(optional - defaults to main)</span>
              </Label>
              <Input
                id={`email-${index}`}
                type="email"
                value={traveler.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder={defaultEmail || "Enter email"}
              />
            </div>

            {/* Phone (optional) */}
            <div className="space-y-2">
              <Label htmlFor={`phone-${index}`}>
                Phone <span className="text-muted-foreground text-xs">(optional - defaults to main)</span>
              </Label>
              <Input
                id={`phone-${index}`}
                type="tel"
                value={traveler.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/[^0-9+]/g, ''))}
                placeholder={defaultPhone || "Enter phone"}
              />
            </div>

            {/* Delete button for non-first travelers */}
            {canDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onDelete}
                className="mt-4"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Traveler
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default TravelerForm;

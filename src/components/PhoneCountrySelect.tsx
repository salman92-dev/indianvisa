import { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALL_COUNTRIES, CountryData } from "@/lib/countryData";
import { useIsMobile } from "@/hooks/use-mobile";

interface PhoneCountrySelectProps {
  value: string;
  onChange: (value: string) => void;
}

// Country code to ISD mapping for auto-detection
const COUNTRY_CODE_TO_ISD: Record<string, string> = {
  US: "+1", CA: "+1", GB: "+44", UK: "+44", AU: "+61", NZ: "+64",
  IN: "+91", PK: "+92", BD: "+880", LK: "+94", NP: "+977",
  AE: "+971", SA: "+966", QA: "+974", KW: "+965", BH: "+973", OM: "+968",
  DE: "+49", FR: "+33", IT: "+39", ES: "+34", NL: "+31", BE: "+32",
  CH: "+41", AT: "+43", SE: "+46", NO: "+47", DK: "+45", FI: "+358",
  PL: "+48", CZ: "+420", PT: "+351", IE: "+353", GR: "+30",
  SG: "+65", MY: "+60", TH: "+66", PH: "+63", ID: "+62", VN: "+84",
  JP: "+81", KR: "+82", CN: "+86", HK: "+852", TW: "+886",
  BR: "+55", MX: "+52", AR: "+54", CO: "+57", CL: "+56",
  ZA: "+27", NG: "+234", EG: "+20", KE: "+254", GH: "+233",
  RU: "+7", TR: "+90", IL: "+972",
};

export function PhoneCountrySelect({ value, onChange }: PhoneCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  // Auto-detect country code on mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Try to get timezone-based country detection
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const countryFromTimezone = getCountryFromTimezone(timezone);
        
        if (countryFromTimezone && COUNTRY_CODE_TO_ISD[countryFromTimezone]) {
          onChange(COUNTRY_CODE_TO_ISD[countryFromTimezone]);
          return;
        }

        // Fallback: Try navigator.language
        const language = navigator.language || (navigator as any).userLanguage;
        if (language) {
          const parts = language.split('-');
          const countryCode = parts.length > 1 ? parts[1].toUpperCase() : parts[0].toUpperCase();
          if (COUNTRY_CODE_TO_ISD[countryCode]) {
            onChange(COUNTRY_CODE_TO_ISD[countryCode]);
            return;
          }
        }
      } catch (error) {
        console.error("Country detection failed:", error);
      }
    };

    // Only auto-detect if default value
    if (value === "+1") {
      detectCountry();
    }
  }, []);

  const selectedCountry = useMemo(() => {
    return ALL_COUNTRIES.find(c => c.isd === value);
  }, [value]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return ALL_COUNTRIES;
    
    const query = searchQuery.toLowerCase().trim();
    return ALL_COUNTRIES.filter(country =>
      country.name.toLowerCase().includes(query) ||
      country.isd.includes(query) ||
      country.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelect = (isd: string) => {
    onChange(isd);
    setOpen(false);
    setSearchQuery("");
  };

  // Full-screen modal for mobile
  if (isMobile && open) {
    return (
      <>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[100px] justify-between px-2 h-9"
          onClick={() => setOpen(true)}
        >
          {selectedCountry ? (
            <span className="flex items-center gap-1 truncate">
              <span className="text-sm">{selectedCountry.flag}</span>
              <span className="text-xs font-medium">{selectedCountry.isd}</span>
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">Select</span>
          )}
          <ChevronsUpDown className="ml-0.5 h-3 w-3 shrink-0 opacity-50" />
        </Button>
        
        {/* Full-screen modal overlay */}
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Select Country</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setOpen(false);
                setSearchQuery("");
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="p-3 border-b">
            <input
              type="text"
              placeholder="Search country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>
          
          {/* Country list */}
          <div className="flex-1 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No country found.</div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={`${country.code}-${country.isd}`}
                  onClick={() => handleSelect(country.isd)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border/50 active:bg-muted",
                    value === country.isd && "bg-primary/10"
                  )}
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="flex-1 text-sm">{country.name}</span>
                  <span className="text-muted-foreground text-sm font-mono">{country.isd}</span>
                  {value === country.isd && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[100px] justify-between px-2 h-9"
        >
          {selectedCountry ? (
            <span className="flex items-center gap-1 truncate">
              <span className="text-sm">{selectedCountry.flag}</span>
              <span className="text-xs font-medium">{selectedCountry.isd}</span>
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">Select</span>
          )}
          <ChevronsUpDown className="ml-0.5 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 bg-background border shadow-lg z-50" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search country..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {filteredCountries.map((country) => (
                <CommandItem
                  key={`${country.code}-${country.isd}`}
                  value={`${country.code}-${country.isd}`}
                  onSelect={() => handleSelect(country.isd)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1 truncate text-sm">{country.name}</span>
                  <span className="text-muted-foreground text-sm font-mono">{country.isd}</span>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === country.isd ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Helper function to get country code from timezone
function getCountryFromTimezone(timezone: string): string | null {
  const timezoneToCountry: Record<string, string> = {
    // Americas
    "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US",
    "America/Los_Angeles": "US", "America/Phoenix": "US", "America/Anchorage": "US",
    "America/Toronto": "CA", "America/Vancouver": "CA", "America/Montreal": "CA",
    "America/Mexico_City": "MX", "America/Sao_Paulo": "BR", "America/Buenos_Aires": "AR",
    // Europe
    "Europe/London": "GB", "Europe/Paris": "FR", "Europe/Berlin": "DE",
    "Europe/Madrid": "ES", "Europe/Rome": "IT", "Europe/Amsterdam": "NL",
    "Europe/Brussels": "BE", "Europe/Zurich": "CH", "Europe/Vienna": "AT",
    "Europe/Stockholm": "SE", "Europe/Oslo": "NO", "Europe/Copenhagen": "DK",
    "Europe/Helsinki": "FI", "Europe/Warsaw": "PL", "Europe/Prague": "CZ",
    "Europe/Lisbon": "PT", "Europe/Dublin": "IE", "Europe/Athens": "GR",
    "Europe/Moscow": "RU", "Europe/Istanbul": "TR",
    // Asia
    "Asia/Kolkata": "IN", "Asia/Mumbai": "IN", "Asia/Delhi": "IN",
    "Asia/Karachi": "PK", "Asia/Dhaka": "BD", "Asia/Colombo": "LK",
    "Asia/Kathmandu": "NP", "Asia/Dubai": "AE", "Asia/Riyadh": "SA",
    "Asia/Qatar": "QA", "Asia/Kuwait": "KW", "Asia/Bahrain": "BH",
    "Asia/Muscat": "OM", "Asia/Singapore": "SG", "Asia/Kuala_Lumpur": "MY",
    "Asia/Bangkok": "TH", "Asia/Manila": "PH", "Asia/Jakarta": "ID",
    "Asia/Ho_Chi_Minh": "VN", "Asia/Tokyo": "JP", "Asia/Seoul": "KR",
    "Asia/Shanghai": "CN", "Asia/Hong_Kong": "HK", "Asia/Taipei": "TW",
    "Asia/Jerusalem": "IL",
    // Oceania
    "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Brisbane": "AU",
    "Australia/Perth": "AU", "Pacific/Auckland": "NZ",
    // Africa
    "Africa/Johannesburg": "ZA", "Africa/Lagos": "NG", "Africa/Cairo": "EG",
    "Africa/Nairobi": "KE", "Africa/Accra": "GH",
  };
  
  return timezoneToCountry[timezone] || null;
}

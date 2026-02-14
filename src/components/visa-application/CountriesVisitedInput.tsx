import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { ALL_COUNTRIES } from "@/lib/countryData";

interface CountryVisit {
  country: string;
  year: string;
}

interface CountriesVisitedInputProps {
  value: CountryVisit[];
  onChange: (visits: CountryVisit[]) => void;
  disabled?: boolean;
}

const COUNTRIES_LIST = ALL_COUNTRIES.map(c => ({ name: c.name, flag: c.flag })).sort((a, b) => a.name.localeCompare(b.name));

const CountriesVisitedInput = ({ value, onChange, disabled }: CountriesVisitedInputProps) => {
  const [rows, setRows] = useState<CountryVisit[]>(() => {
    if (value && value.length > 0) {
      return value.length < 5 
        ? [...value, ...Array(5 - value.length).fill(null).map(() => ({ country: "", year: "" }))]
        : value;
    }
    return Array(5).fill(null).map(() => ({ country: "", year: "" }));
  });

  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [searchTerms, setSearchTerms] = useState<string[]>(() => 
    rows.map(r => r.country)
  );
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sync with external value changes
  useEffect(() => {
    if (value && value.length > 0) {
      const newRows = value.length < 5 
        ? [...value, ...Array(5 - value.length).fill(null).map(() => ({ country: "", year: "" }))]
        : value;
      setRows(newRows);
      setSearchTerms(newRows.map(r => r.country));
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdown !== null) {
        const ref = dropdownRefs.current[openDropdown];
        if (ref && !ref.contains(e.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const updateRow = (index: number, field: keyof CountryVisit, val: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: val };
    setRows(updated);
    emitChange(updated);
  };

  const emitChange = (updated: CountryVisit[]) => {
    const filtered = updated.filter(r => r.country.trim() !== "");
    onChange(filtered);
  };

  const handleCountrySelect = (index: number, countryName: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], country: countryName };
    setRows(updated);
    
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = countryName;
    setSearchTerms(newSearchTerms);
    
    setOpenDropdown(null);
    emitChange(updated);
  };

  const handleSearchChange = (index: number, val: string) => {
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = val;
    setSearchTerms(newSearchTerms);
    setOpenDropdown(index);
    
    // If exact match, set it
    const exactMatch = COUNTRIES_LIST.find(c => c.name.toLowerCase() === val.toLowerCase());
    if (exactMatch) {
      updateRow(index, "country", exactMatch.name);
    } else {
      updateRow(index, "country", val);
    }
  };

  const addRow = () => {
    const updated = [...rows, { country: "", year: "" }];
    setRows(updated);
    setSearchTerms([...searchTerms, ""]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    const updated = rows.filter((_, i) => i !== index);
    const newSearchTerms = searchTerms.filter((_, i) => i !== index);
    setRows(updated);
    setSearchTerms(newSearchTerms);
    emitChange(updated);
  };

  const getFilteredCountries = (search: string) => {
    if (!search) return COUNTRIES_LIST.slice(0, 10);
    return COUNTRIES_LIST.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 10);
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2 sm:gap-3">
          <span className="w-6 text-sm font-medium text-muted-foreground shrink-0">
            {index + 1}.
          </span>
          
          <div className="relative flex-1" ref={el => dropdownRefs.current[index] = el}>
            <Input
              placeholder="Type country name..."
              value={searchTerms[index] || ""}
              onChange={(e) => handleSearchChange(index, e.target.value)}
              onFocus={() => setOpenDropdown(index)}
              disabled={disabled}
              className="w-full"
            />
            {openDropdown === index && !disabled && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {getFilteredCountries(searchTerms[index] || "").map((country) => (
                  <button
                    key={country.name}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                    onClick={() => handleCountrySelect(index, country.name)}
                  >
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </button>
                ))}
                {getFilteredCountries(searchTerms[index] || "").length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No countries found
                  </div>
                )}
              </div>
            )}
          </div>

          <Input
            type="number"
            placeholder="Year"
            value={row.year}
            onChange={(e) => updateRow(index, "year", e.target.value)}
            disabled={disabled}
            min={currentYear - 10}
            max={currentYear}
            className="w-20 sm:w-24 shrink-0"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeRow(index)}
            disabled={disabled || rows.length <= 1}
            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={disabled}
        className="mt-2"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Another Country
      </Button>
    </div>
  );
};

export default CountriesVisitedInput;

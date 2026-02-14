import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, X } from "lucide-react";
import { ALL_COUNTRIES, CountryData } from "@/lib/countryData";

const COUNTRIES_SORTED = [...ALL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

interface SearchableCountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  valueType?: "name" | "code"; // Whether to use country name or code as value
  className?: string;
}

const SearchableCountrySelect = ({
  value,
  onChange,
  placeholder = "Select country",
  disabled = false,
  valueType = "name",
  className,
}: SearchableCountrySelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Get selected country
  const selectedCountry = COUNTRIES_SORTED.find(
    (c) => (valueType === "code" ? c.code : c.name) === value
  );

  // Filter countries based on search
  const filteredCountries = search.trim()
    ? COUNTRIES_SORTED.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES_SORTED;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = useCallback(
    (country: CountryData) => {
      onChange(valueType === "code" ? country.code : country.name);
      setIsOpen(false);
      setSearch("");
    },
    [onChange, valueType]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < filteredCountries.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (isOpen && filteredCountries[highlightedIndex]) {
          handleSelect(filteredCountries[highlightedIndex]);
        } else {
          setIsOpen(true);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearch("");
        break;
      case "Tab":
        setIsOpen(false);
        setSearch("");
        break;
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  // Highlight matched text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {isOpen ? (
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : placeholder}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-full"
            autoFocus
            disabled={disabled}
          />
        ) : (
          <button
            type="button"
            className="flex-1 h-full px-3 text-left flex items-center gap-2"
            onClick={() => !disabled && setIsOpen(true)}
            disabled={disabled}
          >
            {selectedCountry ? (
              <>
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="truncate">{selectedCountry.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </button>
        )}
        <div className="flex items-center gap-1 pr-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-popover shadow-lg"
        >
          {filteredCountries.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No countries found
            </div>
          ) : (
            filteredCountries.map((country, index) => (
              <button
                key={country.code}
                type="button"
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground",
                  index === highlightedIndex && "bg-accent text-accent-foreground",
                  (valueType === "code" ? country.code : country.name) === value &&
                    "bg-primary/10"
                )}
                onClick={() => handleSelect(country)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="text-lg shrink-0">{country.flag}</span>
                <span className="flex-1 truncate">
                  {highlightMatch(country.name, search)}
                </span>
                {(valueType === "code" ? country.code : country.name) === value && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableCountrySelect;

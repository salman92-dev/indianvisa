import { Label } from "@/components/ui/label";
import SearchableCountrySelect from "@/components/ui/SearchableCountrySelect";

interface NationalitySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const NationalitySelector = ({ value, onChange }: NationalitySelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">Your Nationality *</Label>
      <SearchableCountrySelect
        value={value}
        onChange={onChange}
        placeholder="Select your nationality"
        valueType="code"
        className="h-12"
      />
    </div>
  );
};

export default NationalitySelector;

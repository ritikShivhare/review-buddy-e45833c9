import { useEffect, useMemo, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  AsYouType,
  type CountryCode,
} from "libphonenumber-js";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Best-effort timezone → ISO country mapping for popular regions
const TZ_TO_COUNTRY: Record<string, CountryCode> = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Dubai": "AE",
  "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD",
  "Asia/Colombo": "LK",
  "Asia/Singapore": "SG",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Bangkok": "TH",
  "Asia/Jakarta": "ID",
  "Asia/Manila": "PH",
  "Asia/Hong_Kong": "HK",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Mexico_City": "MX",
  "America/Sao_Paulo": "BR",
  "Africa/Cairo": "EG",
  "Africa/Lagos": "NG",
  "Africa/Johannesburg": "ZA",
};

const detectCountry = (): CountryCode => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TZ_TO_COUNTRY[tz]) return TZ_TO_COUNTRY[tz];
    const lang = navigator.language || "";
    const region = lang.split("-")[1]?.toUpperCase();
    if (region && getCountries().includes(region as CountryCode)) return region as CountryCode;
  } catch {
    // ignore
  }
  return "IN";
};

const flagEmoji = (cc: string) => {
  if (!/^[A-Z]{2}$/.test(cc)) return "🌐";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + cc.charCodeAt(0) - 65) + String.fromCodePoint(A + cc.charCodeAt(1) - 65);
};

// Display names via Intl when supported
const getCountryName = (cc: string): string => {
  try {
    const dn = new Intl.DisplayNames([navigator.language || "en"], { type: "region" });
    return dn.of(cc) || cc;
  } catch {
    return cc;
  }
};

interface PhoneInputProps {
  value: string;
  onChange: (e164: string) => void;
  onValidChange?: (valid: boolean) => void;
  defaultCountry?: CountryCode;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export const PhoneInput = ({
  value,
  onChange,
  onValidChange,
  defaultCountry,
  placeholder = "Phone number",
  id,
  className,
  disabled,
}: PhoneInputProps) => {
  // Initialize country from value if it's already E.164, else default/auto
  const initial = useMemo<CountryCode>(() => {
    if (value) {
      const parsed = parsePhoneNumberFromString(value);
      if (parsed?.country) return parsed.country;
    }
    return defaultCountry || detectCountry();
  }, []); // intentional: only on mount

  const [country, setCountry] = useState<CountryCode>(initial);
  const [open, setOpen] = useState(false);

  // National (local) digits the user types
  const [national, setNational] = useState<string>(() => {
    if (value) {
      const parsed = parsePhoneNumberFromString(value);
      if (parsed) return parsed.nationalNumber as string;
    }
    return "";
  });

  // Emit changes upward
  useEffect(() => {
    if (!national) {
      onChange("");
      onValidChange?.(false);
      return;
    }
    const e164 = `+${getCountryCallingCode(country)}${national}`;
    onChange(e164);
    onValidChange?.(isValidPhoneNumber(e164));
  }, [country, national]); // eslint-disable-line react-hooks/exhaustive-deps

  const countries = useMemo(() => {
    const list = getCountries().map((cc) => ({
      cc,
      name: getCountryName(cc),
      dial: getCountryCallingCode(cc),
    }));
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, []);

  const formatted = useMemo(() => {
    if (!national) return "";
    try {
      const ayt = new AsYouType(country);
      ayt.input(`+${getCountryCallingCode(country)}${national}`);
      return ayt.formattedOutput || national;
    } catch {
      return national;
    }
  }, [national, country]);

  return (
    <div className={cn("flex", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="rounded-r-none border-r-0 px-3 font-normal"
          >
            <span className="mr-1 text-base leading-none">{flagEmoji(country)}</span>
            <span className="text-sm tabular-nums">+{getCountryCallingCode(country)}</span>
            <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country…" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countries.map((c) => (
                  <CommandItem
                    key={c.cc}
                    value={`${c.name} ${c.cc} +${c.dial}`}
                    onSelect={() => {
                      setCountry(c.cc as CountryCode);
                      setOpen(false);
                    }}
                  >
                    <span className="mr-2 text-base leading-none">{flagEmoji(c.cc)}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground tabular-nums">+{c.dial}</span>
                    {c.cc === country && <Check className="ml-2 h-3.5 w-3.5" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={placeholder}
        value={formatted}
        disabled={disabled}
        onChange={(e) => {
          // keep digits only, max 15 per E.164
          const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
          setNational(digits);
        }}
        className="rounded-l-none"
      />
    </div>
  );
};

export default PhoneInput;

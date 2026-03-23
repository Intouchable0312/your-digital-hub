import { useState, useMemo } from "react";
import { icons } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// Popular icons to show first
const POPULAR = [
  "Globe", "Home", "Settings", "Mail", "Calendar", "FileText", "Image",
  "Music", "Video", "ShoppingCart", "CreditCard", "BarChart3", "Users",
  "MessageSquare", "Bell", "Bookmark", "Heart", "Star", "Zap", "Cloud",
  "Database", "Code", "Terminal", "Smartphone", "Monitor", "Wifi",
  "Camera", "Mic", "Headphones", "Gamepad2", "Palette", "Layers",
  "Map", "Navigation", "Plane", "Car", "Building2", "GraduationCap",
  "Briefcase", "Wallet", "PiggyBank", "TrendingUp", "Activity",
  "Shield", "Lock", "Key", "Eye", "Search", "Filter", "Download",
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const [search, setSearch] = useState("");

  const filteredIcons = useMemo(() => {
    const allNames = Object.keys(icons);
    if (!search) {
      // Show popular first, then rest
      const rest = allNames.filter((n) => !POPULAR.includes(n));
      return [...POPULAR.filter((n) => allNames.includes(n)), ...rest];
    }
    return allNames.filter((n) =>
      n.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Rechercher une icône..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-secondary border-border rounded-xl"
      />
      <ScrollArea className="h-48">
        <div className="grid grid-cols-8 gap-2">
          {filteredIcons.slice(0, 200).map((name) => {
            const Icon = icons[name as keyof typeof icons];
            if (!Icon) return null;
            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange(name)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150
                  ${
                    value === name
                      ? "bg-primary text-primary-foreground scale-110"
                      : "bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                title={name}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default IconPicker;

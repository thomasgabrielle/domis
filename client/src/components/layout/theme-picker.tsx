import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";

const themes = [
  {
    id: "default",
    label: "Navy + Emerald",
    primary: "hsl(222, 47%, 30%)",
    accent: "hsl(160, 60%, 45%)",
  },
  {
    id: "teal-amber",
    label: "Teal + Amber",
    primary: "hsl(180, 50%, 30%)",
    accent: "hsl(38, 85%, 55%)",
  },
  {
    id: "forest-gold",
    label: "Forest + Gold",
    primary: "hsl(152, 45%, 25%)",
    accent: "hsl(45, 80%, 50%)",
  },
  {
    id: "royal-coral",
    label: "Royal Blue + Coral",
    primary: "hsl(230, 60%, 45%)",
    accent: "hsl(16, 80%, 60%)",
  },
];

export function ThemePicker() {
  const [current, setCurrent] = useState(() => {
    return localStorage.getItem("pap-theme") || "default";
  });

  useEffect(() => {
    applyTheme(current);
  }, []);

  function applyTheme(themeId: string) {
    const root = document.documentElement;
    if (themeId === "default") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", themeId);
    }
    localStorage.setItem("pap-theme", themeId);
    setCurrent(themeId);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => applyTheme(theme.id)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="flex gap-1">
              <div
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: theme.primary }}
              />
              <div
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: theme.accent }}
              />
            </div>
            <span>{theme.label}</span>
            {current === theme.id && (
              <span className="ml-auto text-primary text-xs font-medium">Active</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

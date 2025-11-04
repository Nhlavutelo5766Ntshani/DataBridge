import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = async () => {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center flex-1 space-x-4">
        {/* Search bar removed */}
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </Button>
      </div>
    </header>
  );
};


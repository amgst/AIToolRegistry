import { Link, useLocation } from "wouter";
import { Settings, List, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AdminNavbar() {
  const [location] = useLocation();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <Button 
                  variant={location === "/admin" ? "default" : "ghost"} 
                  size="sm"
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              
              <Link href="/admin/tools">
                <Button 
                  variant={location === "/admin/tools" ? "default" : "ghost"} 
                  size="sm"
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  <span>Tools List</span>
                </Button>
              </Link>
            </div>
          </div>
          
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

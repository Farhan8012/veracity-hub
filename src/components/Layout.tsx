import { ReactNode, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Moon, Sun, LogOut, User, Shield, FileText, History, Bookmark } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FloatingActionButton } from "@/components/FloatingActionButton";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Persist theme to localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            TruthWave
          </Link>

          <nav className="flex items-center gap-2 md:gap-4">
            {user && (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/verify">Verify</Link>
                </Button>
                <Button variant="ghost" asChild className="hidden md:inline-flex">
                  <Link to="/history">History</Link>
                </Button>
                <Button variant="ghost" asChild className="hidden md:inline-flex">
                  <Link to="/bookmarks">Bookmarks</Link>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeChange}
              className="relative overflow-hidden"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="backdrop-blur-md bg-popover/95">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} className="md:hidden">
                    <FileText className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/history")} className="md:hidden">
                    <History className="mr-2 h-4 w-4" />
                    History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/bookmarks")} className="md:hidden">
                    <Bookmark className="mr-2 h-4 w-4" />
                    Bookmarks
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="md:hidden" />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/activity")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Activity
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="bg-gradient-to-r from-primary to-primary/80">
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {user && <FloatingActionButton />}

      <footer className="border-t bg-card/80 backdrop-blur-md py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 TruthWave. Built with Lovable Cloud.
        </div>
      </footer>
    </div>
  );
}

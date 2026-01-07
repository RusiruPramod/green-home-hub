import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="text-center max-w-md w-full">
        <h1 className="mb-4 text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">Oops! Page not found</p>
        <p className="mb-8 text-xs sm:text-sm text-muted-foreground/80">The page you're looking for doesn't exist.</p>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <a href="/">
            <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Return to Home
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

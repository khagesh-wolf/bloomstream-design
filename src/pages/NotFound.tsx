import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Coffee, Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Coffee className="w-12 h-12 text-primary" />
        </div>
        <h1 className="font-serif text-6xl font-bold gradient-text mb-4">404</h1>
        <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Looks like this cup of tea got lost. Let's get you back to the main hub.
        </p>
        <Link to="/">
          <Button size="lg">
            <Home className="w-4 h-4 mr-2" />
            Back to Hub
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

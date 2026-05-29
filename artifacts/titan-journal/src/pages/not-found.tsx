import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background app-glow">
      <Card className="w-full max-w-md mx-4 border-card-border shadow-lg">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            The page you are looking for does not exist.
          </p>

          <Link href="/" className="inline-block mt-6 text-sm font-medium text-primary hover:underline">
            Back to Dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

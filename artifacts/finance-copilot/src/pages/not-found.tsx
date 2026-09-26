import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="auth-surface flex min-h-[100dvh] w-full items-center justify-center">
      <Card className="glass-panel mx-4 w-full max-w-md border-border">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">
              404 Page Not Found
            </h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            The page you are looking for is not part of this workspace.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

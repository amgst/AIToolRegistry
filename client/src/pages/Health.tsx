import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Database, Loader2 } from "lucide-react";
import { Link } from "wouter";

type HealthStatus = {
  status: "ok" | "error";
  database: string;
  connected: boolean;
  collection?: string;
  sampleCount?: number;
  message?: string;
  error?: string;
  hint?: string;
};

export default function Health() {
  const { data: health, isLoading, error } = useQuery<HealthStatus>({
    queryKey: ["/api/health"],
    queryFn: async () => {
      const response = await fetch("/api/health");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Health check failed");
      }
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-muted-foreground">Checking health status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Health Check Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <Link href="/">
              <a className="text-primary hover:underline">← Back to Home</a>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isHealthy = health?.status === "ok" && health?.connected;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <a className="text-primary hover:underline">← Back to Home</a>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isHealthy ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              System Health Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Database:</span>
              </div>
              <Badge variant={isHealthy ? "default" : "destructive"}>
                {health?.database || "Unknown"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Connection Status:</span>
              <Badge variant={health?.connected ? "default" : "destructive"}>
                {health?.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>

            {health?.collection && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Collection:</span>
                <span className="text-muted-foreground">{health.collection}</span>
              </div>
            )}

            {health?.sampleCount !== undefined && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Sample Documents:</span>
                <Badge variant={health.sampleCount > 0 ? "default" : "secondary"}>
                  {health.sampleCount}
                </Badge>
              </div>
            )}

            {health?.message && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{health.message}</p>
              </div>
            )}

            {health?.error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium mb-2">Error:</p>
                <p className="text-sm text-destructive">{health.error}</p>
                {health?.hint && (
                  <p className="text-sm text-muted-foreground mt-2">{health.hint}</p>
                )}
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Last checked: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


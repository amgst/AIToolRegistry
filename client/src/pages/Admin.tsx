import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, Download, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { AiTool, InsertAiTool } from "@shared/schema";

const categories = [
  "Content AI",
  "Image AI",
  "Video AI",
  "Code AI",
  "Marketing AI",
  "Data AI",
  "Voice AI",
];

const badges = ["Featured", "New", "Trending"];

// Define type for scraped tool items
type ScrapedTool = {
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  category?: string | null;
  pricing?: string | null;
  websiteUrl?: string | null;
  features?: string[];
  tags?: string[];
  badge?: string | null;
  rating?: number | null;
  sourceDetailUrl?: string | null;
};

// Define type for scraping sources
type ScrapingSource = {
  id: string;
  name: string;
  type: string;
  url: string;
  enabled: boolean;
  schedule?: string;
  limit?: number;
  concurrency?: number;
};

type IngestResult = {
  scraped: number;
  inserted: number;
  updated?: number;
  skipped: number;
  dryRun: boolean;
  processed?: string[];
  skippedItems?: Array<{ slug: string; reason: string }>;
  errors?: string[];
  metadata?: Record<string, any>;
};

export default function Admin() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<AiTool | null>(null);
  const { toast } = useToast();

  // Scrape & Import state
  const [scrapeUrl, setScrapeUrl] = useState<string>("https://www.aitoolnet.com/");
  const [scrapeLimit, setScrapeLimit] = useState<number>(10);
  const [scrapedItems, setScrapedItems] = useState<ScrapedTool[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  
  // New scraper system state
  const [ingestingSourceId, setIngestingSourceId] = useState<string | null>(null);
  const [ingestResults, setIngestResults] = useState<Map<string, IngestResult>>(new Map());
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [customLimit, setCustomLimit] = useState<Map<string, number>>(new Map());
  const [isCreatingSource, setIsCreatingSource] = useState(false);
  const [newSource, setNewSource] = useState({
    name: "",
    type: "generic",
    url: "",
    limit: 100,
  });

  // Fetch tools for Admin list
  const { data: toolsData, isLoading } = useQuery<AiTool[]>({ queryKey: ["/api/tools"] });
  const tools = toolsData ?? [];

  // Fetch available scrapers
  const { data: scrapersData } = useQuery<{ available: string[] }>({ 
    queryKey: ["/api/scrapers"] 
  });

  // Fetch scraping sources
  const { data: sourcesData, refetch: refetchSources } = useQuery<ScrapingSource[]>({ 
    queryKey: ["/api/scrapers/sources"] 
  });
  const sources = sourcesData ?? [];

  // Update source mutation
  const updateSourceMutation = useMutation({
    mutationFn: async ({ sourceId, updates }: { sourceId: string; updates: Partial<ScrapingSource> }) => {
      const res = await apiRequest("PATCH", `/api/scrapers/sources/${sourceId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scrapers/sources"] });
      setEditingSourceId(null);
      toast({ title: "Source updated successfully!" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update source",
        variant: "destructive",
      });
    },
  });

  // Create source mutation
  const createSourceMutation = useMutation({
    mutationFn: async (source: { name: string; type: string; url: string; limit: number }) => {
      const res = await apiRequest("POST", "/api/scrapers/sources", source);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scrapers/sources"] });
      setIsCreatingSource(false);
      setNewSource({ name: "", type: "generic", url: "", limit: 100 });
      toast({ title: "Source created successfully!" });
    },
    onError: (error: Error) => {
      console.error("Error creating source:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create source",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAiTool) => {
      const res = await apiRequest("POST", "/api/tools", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      setIsDialogOpen(false);
      toast({ title: "Tool created successfully!" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create tool",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAiTool> }) => {
      const res = await apiRequest("PATCH", `/api/tools/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      setIsDialogOpen(false);
      setEditingTool(null);
      toast({ title: "Tool updated successfully!" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tool",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/tools/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      toast({ title: "Tool deleted successfully!" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete tool",
        variant: "destructive",
      });
    },
  });

  const scrapeMutation = useMutation({
    mutationFn: async ({ url, limit }: { url: string; limit: number }) => {
      const res = await apiRequest("POST", "/api/scrape/aitoolnet", { url, limit });
      return res.json() as Promise<{ count: number; items: ScrapedTool[] }>;
    },
    onSuccess: (data) => {
      setScrapedItems(data.items ?? []);
      setSelectedSlugs(new Set());
      toast({ title: "Scrape complete", description: `Found ${data.count} items` });
    },
    onError: (error: any) => {
      const message = (error instanceof Error ? error.message : String(error)) || "Failed to scrape";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const toggleSelect = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const selectAll = (checked: boolean) => {
    setSelectedSlugs(checked ? new Set(scrapedItems.map((i) => i.slug)) : new Set());
  };

  const importSelected = async () => {
    const toImport = scrapedItems.filter((i) => selectedSlugs.has(i.slug) && !!i.websiteUrl);
    let imported = 0;
    let skipped = 0;

    for (const item of toImport) {
      const payload: InsertAiTool = {
        slug: item.slug,
        name: item.name,
        description: item.description ?? item.name,
        shortDescription: item.shortDescription ?? item.name,
        category: item.category ?? "Content AI",
        pricing: item.pricing ?? "Unknown",
        websiteUrl: item.websiteUrl!,
        features: item.features ?? [],
        tags: item.tags ?? [],
        useCases: [],
        screenshots: [],
        badge: item.badge ?? undefined,
        rating: item.rating ?? undefined,
      };

      try {
        await apiRequest("POST", "/api/tools", payload);
        imported++;
      } catch {
        skipped++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
    toast({ title: "Import complete", description: `Imported ${imported}, skipped ${skipped}` });
    setSelectedSlugs(new Set());
  };

  // Ingest from a source (new scraper system)
  const ingestMutation = useMutation({
    mutationFn: async ({ sourceId, dryRun = false, updateExisting = false, customLimit }: { sourceId: string; dryRun?: boolean; updateExisting?: boolean; customLimit?: number }) => {
      // Temporarily update source limit if customLimit is provided
      if (customLimit !== undefined) {
        await apiRequest("PATCH", `/api/scrapers/sources/${sourceId}`, { limit: customLimit });
      }
      
      const res = await apiRequest("POST", `/api/scrapers/ingest/${sourceId}`, { dryRun, updateExisting });
      
      // Restore original limit after import
      if (customLimit !== undefined) {
        const source = sources.find(s => s.id === sourceId);
        if (source && source.limit) {
          await apiRequest("PATCH", `/api/scrapers/sources/${sourceId}`, { limit: source.limit });
        }
      }
      
      return res.json() as Promise<IngestResult>;
    },
    onSuccess: (data, variables) => {
      setIngestResults((prev) => {
        const next = new Map(prev);
        next.set(variables.sourceId, data);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      let message = "";
      if (data.dryRun) {
        message = `Would import ${data.inserted} tools, skip ${data.skipped}`;
        if (data.updated !== undefined) {
          message += `, update ${data.updated}`;
        }
      } else {
        message = `Imported ${data.inserted} tools`;
        if (data.updated !== undefined && data.updated > 0) {
          message += `, updated ${data.updated} existing tools`;
        }
        if (data.skipped > 0) {
          message += `, skipped ${data.skipped} (already exist)`;
        }
      }
      toast({ 
        title: data.dryRun ? "Dry Run Complete" : "Import Complete", 
        description: message 
      });
      setIngestingSourceId(null);
    },
    onError: (error: any) => {
      const message = (error instanceof Error ? error.message : String(error)) || "Failed to import";
      toast({ title: "Error", description: message, variant: "destructive" });
      setIngestingSourceId(null);
    },
  });

  const handleIngest = (sourceId: string, dryRun = false, updateExisting = false, customLimit?: number) => {
    setIngestingSourceId(sourceId);
    ingestMutation.mutate({ sourceId, dryRun, updateExisting, customLimit });
  };

  // Scrape all enabled sources
  const scrapeAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/scrapers/scrape-all", { enabledOnly: true });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Scrape All Complete", 
        description: `Scraped ${data.total} sources. ${data.successful} successful, ${data.failed} failed.` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scrapers/sources"] });
    },
    onError: (error: any) => {
      const message = (error instanceof Error ? error.message : String(error)) || "Failed to scrape all";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const getStr = (key: string) => {
      const v = formData.get(key);
      return typeof v === "string" ? v.trim() : undefined;
    };

    const featuresRaw = getStr("features");
    const tagsRaw = getStr("tags");
    const useCasesRaw = getStr("useCases");
    const screenshotsRaw = getStr("screenshots");
    const socialLinksRaw = getStr("socialLinks");
    const pricingDetailsRaw = getStr("pricingDetails");

    // Parse JSON fields
    let socialLinks: Record<string, string> | undefined;
    if (socialLinksRaw) {
      try {
        socialLinks = JSON.parse(socialLinksRaw);
      } catch {
        // Invalid JSON, skip it
      }
    }

    let pricingDetails: any | undefined;
    if (pricingDetailsRaw) {
      try {
        pricingDetails = JSON.parse(pricingDetailsRaw);
      } catch {
        // Invalid JSON, skip it
      }
    }

    const data: Partial<InsertAiTool> = {
      // Slug optional; server will slugify from name when absent
      slug: getStr("slug"),
      name: getStr("name") || "", // only required field
      shortDescription: getStr("shortDescription"),
      description: getStr("description"),
      category: getStr("category"),
      pricing: getStr("pricing"),
      websiteUrl: getStr("websiteUrl"),
      features: featuresRaw
        ? featuresRaw
            .split("\n")
            .map((f) => f.trim())
            .filter(Boolean)
        : [],
      tags: tagsRaw
        ? tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      badge: getStr("badge") || null,
      rating: getStr("rating") ? parseFloat(getStr("rating") as string) : null,
      // Extended fields
      developer: getStr("developer"),
      documentationUrl: getStr("documentationUrl"),
      sourceDetailUrl: getStr("sourceDetailUrl"),
      launchDate: getStr("launchDate"),
      useCases: useCasesRaw
        ? useCasesRaw
            .split("\n")
            .map((u) => u.trim())
            .filter(Boolean)
        : [],
      screenshots: screenshotsRaw
        ? screenshotsRaw
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      socialLinks: socialLinks,
      pricingDetails: pricingDetails,
    };

    if (editingTool) {
      updateMutation.mutate({ id: editingTool.id, data });
    } else {
      createMutation.mutate(data as InsertAiTool);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">AI</span>
              </div>
              <span className="font-bold text-xl">AI Tools Directory - Admin</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/">
              <Button variant="ghost" data-testid="button-back-home">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          <Button
            onClick={() => {
              setEditingTool(null);
              setIsDialogOpen(true);
            }}
            data-testid="button-add-tool"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Tool
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Tools ({tools.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : tools.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tools yet. Add your first tool!
              </div>
            ) : (
              <div className="space-y-4">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{tool.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tool.category} • {tool.pricing}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingTool(tool);
                          setIsDialogOpen(true);
                        }}
                        data-testid={`button-edit-${tool.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this tool?")) {
                            deleteMutation.mutate(tool.id);
                          }
                        }}
                        data-testid={`button-delete-${tool.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Easy Scraping Section - New Scraper System */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Easy Scraping</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingSource(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchSources()}
                  disabled={scrapeAllMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrapeAllMutation.mutate()}
                  disabled={scrapeAllMutation.isPending}
                >
                  {scrapeAllMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scraping All...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Scrape All Enabled
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isCreatingSource && (
              <div className="mb-6 p-4 border rounded-lg bg-accent/50 space-y-4">
                <h3 className="font-semibold">Create New Scraping Source</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-source-name">Source Name</Label>
                    <Input
                      id="new-source-name"
                      value={newSource.name}
                      onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                      placeholder="e.g., My Custom Website"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-source-type">Scraper Type</Label>
                    <Select
                      value={newSource.type}
                      onValueChange={(value) => setNewSource({ ...newSource, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generic">Generic (Any Website)</SelectItem>
                        <SelectItem value="aitoolnet">AIToolNet</SelectItem>
                        <SelectItem value="futuretools">FutureTools</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use "Generic" for any website
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="new-source-url">Website URL</Label>
                    <Input
                      id="new-source-url"
                      type="url"
                      value={newSource.url}
                      onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                      placeholder="https://example.com/ai-tools"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the URL of the page listing AI tools
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="new-source-limit">Limit</Label>
                    <Input
                      id="new-source-limit"
                      type="number"
                      min={1}
                      max={500}
                      value={newSource.limit}
                      onChange={(e) => setNewSource({ ...newSource, limit: parseInt(e.target.value || "100", 10) })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      // Ensure limit is a valid number
                      const sourceToCreate = {
                        ...newSource,
                        limit: typeof newSource.limit === 'number' ? newSource.limit : parseInt(String(newSource.limit || "100"), 10),
                      };
                      console.log("Creating source:", sourceToCreate);
                      createSourceMutation.mutate(sourceToCreate);
                    }}
                    disabled={!newSource.name || !newSource.url || createSourceMutation.isPending}
                  >
                    {createSourceMutation.isPending ? "Creating..." : "Create Source"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreatingSource(false);
                      setNewSource({ name: "", type: "generic", url: "", limit: 100 });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {sources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No scraping sources configured. Configure sources via API to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {sources.map((source) => {
                  const isIngesting = ingestingSourceId === source.id;
                  const result = ingestResults.get(source.id);
                  const hasResult = result !== undefined;

                  return (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{source.name}</h3>
                          {source.enabled ? (
                            <Badge variant="default" className="text-xs">Enabled</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Disabled</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">{source.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {source.url}
                        </p>
                        {source.schedule && (
                          <p className="text-xs text-muted-foreground">
                            Schedule: {source.schedule}
                          </p>
                        )}
                        {hasResult && (
                          <div className="mt-2 text-xs space-y-1">
                            <div className="flex items-center gap-4 flex-wrap">
                              <span className="text-green-600 dark:text-green-400">
                                ✓ Inserted: {result.inserted}
                              </span>
                              {result.updated !== undefined && result.updated > 0 && (
                                <span className="text-blue-600 dark:text-blue-400">
                                  ↻ Updated: {result.updated}
                                </span>
                              )}
                              <span className="text-yellow-600 dark:text-yellow-400">
                                ⊘ Skipped: {result.skipped}
                              </span>
                              <span className="text-muted-foreground">
                                📥 Scraped: {result.scraped}
                              </span>
                            </div>
                            {result.skippedItems && result.skippedItems.length > 0 && result.skippedItems.length <= 5 && (
                              <div className="text-yellow-600 dark:text-yellow-400 mt-1">
                                {result.skippedItems.map((item, idx) => (
                                  <div key={idx} className="truncate" title={item.reason}>
                                    • {item.slug}: {item.reason}
                                  </div>
                                ))}
                              </div>
                            )}
                            {result.errors && result.errors.length > 0 && (
                              <div className="text-red-600 dark:text-red-400">
                                Errors: {result.errors.length}
                              </div>
                            )}
                          </div>
                        )}
                        {editingSourceId === source.id ? (
                          <div className="mt-3 p-3 border rounded-lg bg-accent/50 space-y-2">
                            <div>
                              <Label htmlFor={`limit-${source.id}`} className="text-xs">Limit</Label>
                              <Input
                                id={`limit-${source.id}`}
                                type="number"
                                min={1}
                                max={500}
                                defaultValue={source.limit || 25}
                                onBlur={(e) => {
                                  const newLimit = parseInt(e.target.value || "25", 10);
                                  if (newLimit !== source.limit) {
                                    updateSourceMutation.mutate({
                                      sourceId: source.id,
                                      updates: { limit: newLimit },
                                    });
                                  }
                                }}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingSourceId(null)}
                                className="text-xs"
                              >
                                Done
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Limit: {source.limit || 25} tools
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-2 ml-2 text-xs"
                              onClick={() => setEditingSourceId(source.id)}
                            >
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleIngest(source.id, true)}
                          disabled={isIngesting}
                          title="Dry run - no changes"
                        >
                          {isIngesting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Test"
                          )}
                        </Button>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            onClick={() => {
                              const limit = customLimit.get(source.id);
                              handleIngest(source.id, false, false, limit);
                            }}
                            disabled={isIngesting || !source.enabled}
                            title="Import new tools only (skip duplicates)"
                          >
                            {isIngesting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Import
                              </>
                            )}
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            max={500}
                            placeholder={`Limit: ${source.limit || 25}`}
                            value={customLimit.get(source.id) || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomLimit((prev) => {
                                const next = new Map(prev);
                                if (val) {
                                  next.set(source.id, parseInt(val, 10));
                                } else {
                                  next.delete(source.id);
                                }
                                return next;
                              });
                            }}
                            className="h-7 text-xs w-20"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const limit = customLimit.get(source.id);
                            handleIngest(source.id, false, true, limit);
                          }}
                          disabled={isIngesting || !source.enabled}
                          title="Import and update existing tools"
                        >
                          {isIngesting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Update
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <p>• <strong>Add Source</strong>: Create new scraping source from any website</p>
              <p>• <strong>Generic Scraper</strong>: Works with any website - automatically detects tools</p>
              <p>• <strong>Test</strong> button: Run a dry run (no database changes)</p>
              <p>• <strong>Import</strong> button: Scrape and import new tools (skips duplicates)</p>
              <p>• <strong>Update</strong> button: Import new tools AND update existing ones</p>
              <p>• <strong>Limit input</strong>: Enter a number (1-500) to scrape more tools in one go</p>
              <p>• <strong>Duplicate Detection</strong>: Checks both slug AND website URL to avoid duplicates</p>
              <p>• <strong>Edit</strong> link: Change the default limit for this source</p>
            </div>
          </CardContent>
        </Card>

        {/* Legacy Scrape & Import Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Legacy Scrape & Import (Manual URL)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div className="flex-1 min-w-[280px]">
                <Label htmlFor="scrapeUrl">Source URL</Label>
                <Input
                  id="scrapeUrl"
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  placeholder="https://www.aitoolnet.com/"
                />
              </div>
              <div>
                <Label htmlFor="scrapeLimit">Limit</Label>
                <Input
                  id="scrapeLimit"
                  type="number"
                  min={1}
                  max={50}
                  value={scrapeLimit}
                  onChange={(e) => setScrapeLimit(parseInt(e.target.value || "10", 10))}
                />
              </div>
              <Button
                onClick={() => scrapeMutation.mutate({ url: scrapeUrl, limit: scrapeLimit })}
                disabled={scrapeMutation.isPending}
                data-testid="button-run-scrape"
              >
                {scrapeMutation.isPending ? "Scraping..." : "Run Scrape"}
              </Button>
              {scrapedItems.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={importSelected}
                  disabled={selectedSlugs.size === 0}
                  data-testid="button-import-selected"
                >
                  Import Selected ({selectedSlugs.size})
                </Button>
              )}
            </div>

            {scrapedItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">No scraped items yet. Run a scrape to see results here.</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedSlugs.size === scrapedItems.length}
                    onCheckedChange={(checked: boolean) => selectAll(!!checked)}
                  />
                  <span className="text-sm">Select all</span>
                </div>
                <div className="divide-y rounded border">
                  {scrapedItems.map((item) => (
                    <div key={item.slug} className="p-3 flex items-start gap-3">
                      <Checkbox
                        checked={selectedSlugs.has(item.slug)}
                        onCheckedChange={() => toggleSelect(item.slug)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{item.name}</h4>
                          {item.websiteUrl && (
                            <a
                              href={item.websiteUrl}
                              className="text-sm text-primary hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Website
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(item.shortDescription || item.description || "").slice(0, 200)}
                        </p>
                        {item.sourceDetailUrl && (
                          <a
                            href={item.sourceDetailUrl}
                            className="text-xs text-muted-foreground hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Source: {item.sourceDetailUrl}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTool ? "Edit Tool" : "Add New Tool"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="slug">Slug (optional, URL-friendly)</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={editingTool?.slug}
                placeholder="e.g., chatgpt"
                data-testid="input-slug"
              />
            </div>

            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingTool?.name}
                placeholder="e.g., ChatGPT"
                required
                data-testid="input-name"
              />
            </div>

            <div>
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                name="shortDescription"
                defaultValue={editingTool?.shortDescription}
                placeholder="Brief one-line description"
                data-testid="input-short-description"
              />
            </div>

            <div>
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingTool?.description}
                placeholder="Detailed description"
                rows={4}
                data-testid="textarea-description"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select name="category" defaultValue={editingTool?.category}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pricing">Pricing (Summary)</Label>
              <Input
                id="pricing"
                name="pricing"
                defaultValue={editingTool?.pricing}
                placeholder="e.g., Free / $20/mo"
                data-testid="input-pricing"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Quick summary displayed in tool cards. Use Pricing Details below for structured information.
              </p>
            </div>

            <div>
              <Label htmlFor="pricingDetails">Pricing Details (JSON)</Label>
              <Textarea
                id="pricingDetails"
                name="pricingDetails"
                defaultValue={editingTool?.pricingDetails ? JSON.stringify(editingTool.pricingDetails, null, 2) : ""}
                placeholder={`{
  "pricingModel": "freemium",
  "freeTrial": "14 days",
  "freeTier": {
    "description": "Limited features",
    "limits": ["10 requests/month", "Basic features only"],
    "features": ["Feature 1", "Feature 2"]
  },
  "plans": [
    {
      "name": "Pro",
      "price": "20",
      "currency": "USD",
      "period": "month",
      "popular": true,
      "features": ["Unlimited requests", "All features", "Priority support"]
    }
  ],
  "notes": "Annual plans available with 20% discount"
}`}
                rows={20}
                data-testid="textarea-pricing-details"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Structured pricing information. pricingModel: free|freemium|subscription|one-time|usage-based|paid|unknown
              </p>
            </div>

            <div>
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                defaultValue={editingTool?.websiteUrl}
                placeholder="https://example.com"
                data-testid="input-website-url"
              />
            </div>

            <div>
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                name="features"
                defaultValue={editingTool?.features?.join("\n")}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                rows={4}
                data-testid="textarea-features"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                name="tags"
                defaultValue={editingTool?.tags?.join(", ")}
                placeholder="AI, Chatbot, GPT"
                data-testid="input-tags"
              />
            </div>

            <div>
              <Label htmlFor="badge">Badge (optional)</Label>
              <Select name="badge" defaultValue={editingTool?.badge ?? undefined}>
                <SelectTrigger data-testid="select-badge">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {/* Removed empty string value option to satisfy SelectItem requirement */}
                  {badges.map((badge) => (
                    <SelectItem key={badge} value={badge}>
                      {badge}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rating">Rating (1-5, optional)</Label>
              <Input
                id="rating"
                name="rating"
                type="number"
                min="1"
                max="5"
                step="0.1"
                defaultValue={editingTool?.rating || ""}
                placeholder="4.5"
                data-testid="input-rating"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Extended Details (Optional)</h3>
            </div>

            <div>
              <Label htmlFor="developer">Developer/Company</Label>
              <Input
                id="developer"
                name="developer"
                defaultValue={editingTool?.developer || ""}
                placeholder="e.g., OpenAI"
                data-testid="input-developer"
              />
            </div>

            <div>
              <Label htmlFor="documentationUrl">Documentation URL</Label>
              <Input
                id="documentationUrl"
                name="documentationUrl"
                type="url"
                defaultValue={editingTool?.documentationUrl || ""}
                placeholder="https://docs.example.com"
                data-testid="input-documentation-url"
              />
            </div>

            <div>
              <Label htmlFor="launchDate">Launch Date</Label>
              <Input
                id="launchDate"
                name="launchDate"
                type="date"
                defaultValue={editingTool?.launchDate ? new Date(editingTool.launchDate).toISOString().split('T')[0] : ""}
                data-testid="input-launch-date"
              />
            </div>

            <div>
              <Label htmlFor="sourceDetailUrl">Source Detail URL</Label>
              <Input
                id="sourceDetailUrl"
                name="sourceDetailUrl"
                type="url"
                defaultValue={editingTool?.sourceDetailUrl || ""}
                placeholder="https://source-website.com/tool-name"
                data-testid="input-source-detail-url"
              />
            </div>

            <div>
              <Label htmlFor="useCases">Use Cases (one per line)</Label>
              <Textarea
                id="useCases"
                name="useCases"
                defaultValue={editingTool?.useCases?.join("\n")}
                placeholder="Use case 1&#10;Use case 2&#10;Use case 3"
                rows={3}
                data-testid="textarea-use-cases"
              />
            </div>

            <div>
              <Label htmlFor="screenshots">Screenshot URLs (one per line)</Label>
              <Textarea
                id="screenshots"
                name="screenshots"
                defaultValue={editingTool?.screenshots?.join("\n")}
                placeholder="https://example.com/screenshot1.png&#10;https://example.com/screenshot2.png"
                rows={3}
                data-testid="textarea-screenshots"
              />
            </div>

            <div>
              <Label htmlFor="socialLinks">Social Links (JSON format)</Label>
              <Textarea
                id="socialLinks"
                name="socialLinks"
                defaultValue={editingTool?.socialLinks ? JSON.stringify(editingTool.socialLinks, null, 2) : ""}
                placeholder='{"twitter": "https://twitter.com/tool", "github": "https://github.com/tool"}'
                rows={4}
                data-testid="textarea-social-links"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter as JSON object with keys like twitter, linkedin, github, etc.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingTool(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-tool"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingTool
                  ? "Update Tool"
                  : "Add Tool"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

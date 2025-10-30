import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
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

export default function Admin() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<AiTool | null>(null);
  const { toast } = useToast();

  // Scrape & Import state
  const [scrapeUrl, setScrapeUrl] = useState<string>("https://www.aitoolnet.com/");
  const [scrapeLimit, setScrapeLimit] = useState<number>(10);
  const [scrapedItems, setScrapedItems] = useState<ScrapedTool[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());

  // Fetch tools for Admin list
  const { data: toolsData, isLoading } = useQuery<AiTool[]>({ queryKey: ["/api/tools"] });
  const tools = toolsData ?? [];

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
        badge: item.badge ?? null,
        rating: item.rating ?? null,
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      slug: formData.get("slug") as string,
      name: formData.get("name") as string,
      shortDescription: formData.get("shortDescription") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      pricing: formData.get("pricing") as string,
      websiteUrl: formData.get("websiteUrl") as string,
      features: (formData.get("features") as string)
        .split("\n")
        .map(f => f.trim())
        .filter(Boolean),
      tags: (formData.get("tags") as string)
        .split(",")
        .map(t => t.trim())
        .filter(Boolean),
      badge: formData.get("badge") as string || null,
      rating: formData.get("rating") ? parseInt(formData.get("rating") as string) : null,
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

        {/* Scrape & Import Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Scrape & Import</CardTitle>
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
              <Label htmlFor="slug">Slug (URL-friendly)</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={editingTool?.slug}
                placeholder="e.g., chatgpt"
                required
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
                required
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
                required
                data-testid="textarea-description"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select name="category" defaultValue={editingTool?.category || categories[0]} required>
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
              <Label htmlFor="pricing">Pricing</Label>
              <Input
                id="pricing"
                name="pricing"
                defaultValue={editingTool?.pricing}
                placeholder="e.g., Free / $20/mo"
                required
                data-testid="input-pricing"
              />
            </div>

            <div>
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                defaultValue={editingTool?.websiteUrl}
                placeholder="https://example.com"
                required
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
                required
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
                required
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

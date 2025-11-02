import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Check, Star, Copy, Share2, Globe, Calendar, Building2, Book, Link as LinkIcon, Image as ImageIcon, Twitter, Github, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import type { AiTool } from "@shared/schema";

export default function ToolDetail() {
  const [, params] = useRoute("/tools/:slug");
  const { toast } = useToast();
  
  const { data: tool, isLoading } = useQuery<AiTool>({
    queryKey: ["/api/tools", params?.slug],
    queryFn: async () => {
      const response = await fetch(`/api/tools/${params?.slug}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Tool not found");
        throw new Error("Failed to fetch tool");
      }
      return response.json();
    },
    enabled: !!params?.slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Tool Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The AI tool you're looking for doesn't exist.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const initials = tool.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Derived info for richer UI
  const descriptionWordCount = (tool.description || "").trim().split(/\s+/).filter(Boolean).length;
  const readingTimeMin = Math.max(1, Math.round(descriptionWordCount / 200));
  let websiteDomain = "";
  try {
    websiteDomain = new URL(tool.websiteUrl).hostname;
  } catch {
    websiteDomain = tool.websiteUrl;
  }
  const featuresCount = tool.features?.length || 0;
  const tagsCount = tool.tags?.length || 0;

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copied`, description: value });
    } catch (err) {
      toast({ title: `Failed to copy ${label}`, description: String(err), variant: "destructive" });
    }
  };

  const sharePage = async () => {
    const url = window.location.href;
    await copyToClipboard(url, "Page URL");
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
              <span className="font-bold text-xl">AI Tools Directory</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Tools
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-start gap-6 mb-6">
                  <Avatar className="h-24 w-24 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-3xl font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h1 className="text-4xl font-bold" data-testid="text-tool-name">
                        {tool.name}
                      </h1>
                      {tool.badge && (
                        <Badge variant={tool.badge === "Featured" ? "default" : tool.badge === "New" ? "destructive" : "outline"}>
                          {tool.badge}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xl text-muted-foreground mb-4">
                      {tool.shortDescription}
                    </p>
                    
                    <div className="flex items-center gap-4 flex-wrap">
                      <Badge variant="outline" className="text-sm">
                        {tool.category}
                      </Badge>
                      {tool.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                          <span className="font-semibold">{tool.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground text-sm">/5.0</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span>{websiteDomain}</span>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(tool.websiteUrl, "Website URL")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">About {tool.name}</h2>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {tool.description}
                    </p>
                    <div className="mt-3 text-sm text-muted-foreground flex flex-wrap gap-4">
                      <span>~{descriptionWordCount} words</span>
                      <span>~{readingTimeMin} min read</span>
                      <span>Features: {featuresCount}</span>
                      <span>Tags: {tagsCount}</span>
                      <span>Slug: <code className="text-xs">{tool.slug}</code> <Button variant="ghost" size="sm" onClick={() => copyToClipboard(tool.slug, "Slug")}><Copy className="h-3 w-3" /></Button></span>
                    </div>
                  </div>

                  {tool.features && tool.features.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
                      <ul className="space-y-3">
                        {tool.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground text-lg">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tool.tags && tool.tags.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-semibold mb-4">Tags</h2>
                      <div className="flex flex-wrap gap-2">
                        {tool.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {tool.useCases && tool.useCases.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-semibold mb-4">Use Cases</h2>
                      <ul className="space-y-2">
                        {tool.useCases.map((useCase, index) => (
                          <li key={index} className="flex items-start gap-2 text-muted-foreground">
                            <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span>{useCase}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tool.screenshots && tool.screenshots.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-semibold mb-4">Screenshots</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tool.screenshots.map((screenshot, index) => (
                          <a
                            key={index}
                            href={screenshot}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={screenshot}
                              alt={`${tool.name} screenshot ${index + 1}`}
                              className="w-full h-auto"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Pricing
                  </h3>
                  <p className="text-2xl font-bold">{tool.pricing}</p>
                  {tool.pricingDetails?.pricingModel && (
                    <Badge variant="outline" className="mt-2">
                      {tool.pricingDetails.pricingModel}
                    </Badge>
                  )}
                </div>

                {tool.pricingDetails && (
                  <div className="space-y-4">
                    {tool.pricingDetails.freeTrial && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Free Trial</h4>
                        <p className="text-sm text-muted-foreground">
                          {typeof tool.pricingDetails.freeTrial === "string"
                            ? tool.pricingDetails.freeTrial
                            : "Available"}
                        </p>
                      </div>
                    )}

                    {tool.pricingDetails.freeTier && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Free Tier</h4>
                        {tool.pricingDetails.freeTier.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {tool.pricingDetails.freeTier.description}
                          </p>
                        )}
                        {tool.pricingDetails.freeTier.limits && tool.pricingDetails.freeTier.limits.length > 0 && (
                          <div className="space-y-1 mb-2">
                            {tool.pricingDetails.freeTier.limits.map((limit, idx) => (
                              <div key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                                <span>•</span>
                                <span>{limit}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {tool.pricingDetails.freeTier.features && tool.pricingDetails.freeTier.features.length > 0 && (
                          <div className="space-y-1">
                            {tool.pricingDetails.freeTier.features.map((feature, idx) => (
                              <div key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                                <Check className="h-3 w-3 text-primary" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {tool.pricingDetails.plans && tool.pricingDetails.plans.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-3">Plans</h4>
                        <div className="space-y-3">
                          {tool.pricingDetails.plans.map((plan, idx) => (
                            <div
                              key={idx}
                              className={`p-3 border rounded-lg ${
                                plan.popular ? "border-primary bg-primary/5" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{plan.name}</span>
                                    {plan.popular && (
                                      <Badge variant="default" className="text-xs">Popular</Badge>
                                    )}
                                  </div>
                                  <div className="text-lg font-bold mt-1">
                                    {plan.currency && plan.currency !== "USD" && `${plan.currency} `}
                                    {plan.price}
                                    {plan.period && (
                                      <span className="text-sm font-normal text-muted-foreground">
                                        /{plan.period}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {plan.features && plan.features.length > 0 && (
                                <div className="space-y-1 mt-2">
                                  {plan.features.map((feature, fIdx) => (
                                    <div key={fIdx} className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Check className="h-3 w-3 text-primary" />
                                      <span>{feature}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {tool.pricingDetails.notes && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Notes</h4>
                        <p className="text-xs text-muted-foreground">{tool.pricingDetails.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Category
                  </h3>
                  <Badge variant="outline">{tool.category}</Badge>
                </div>

                {tool.rating && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Rating
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= Math.round(tool.rating!)
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold">{tool.rating.toFixed(1)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Website</h3>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>{websiteDomain}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(tool.websiteUrl, "Website URL")}>
                        <Copy className="h-4 w-4 mr-1" /> Copy
                      </Button>
                      <Button variant="default" size="sm" onClick={() => window.open(tool.websiteUrl, "_blank")} data-testid="button-visit-website">
                        Visit <ExternalLink className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {tool.developer && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Developer</h3>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{tool.developer}</span>
                    </div>
                  </div>
                )}

                {tool.documentationUrl && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Documentation</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(tool.documentationUrl!, "_blank")}
                    >
                      <Book className="h-4 w-4 mr-2" />
                      View Docs
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                {tool.socialLinks && Object.keys(tool.socialLinks).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Social Links</h3>
                    <div className="flex flex-wrap gap-2">
                      {tool.socialLinks.twitter && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(tool.socialLinks!.twitter, "_blank")}
                        >
                          <Twitter className="h-4 w-4 mr-1" />
                          Twitter
                        </Button>
                      )}
                      {tool.socialLinks.github && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(tool.socialLinks!.github, "_blank")}
                        >
                          <Github className="h-4 w-4 mr-1" />
                          GitHub
                        </Button>
                      )}
                      {tool.socialLinks.linkedin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(tool.socialLinks!.linkedin, "_blank")}
                        >
                          <Linkedin className="h-4 w-4 mr-1" />
                          LinkedIn
                        </Button>
                      )}
                      {Object.entries(tool.socialLinks).map(([key, url]) => {
                        if (key === "twitter" || key === "github" || key === "linkedin") return null;
                        return (
                          <Button
                            key={key}
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(url, "_blank")}
                          >
                            <LinkIcon className="h-4 w-4 mr-1" />
                            {key}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Tool Info</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Slug</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs">{tool.slug}</code>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(tool.slug, "Slug")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between"><span>Features</span><span className="font-medium">{featuresCount}</span></div>
                    <div className="flex items-center justify-between"><span>Tags</span><span className="font-medium">{tagsCount}</span></div>
                    {tool.launchDate && (
                      <div className="flex items-center justify-between">
                        <span>Launch Date</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(tool.launchDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                    {tool.lastUpdated && (
                      <div className="flex items-center justify-between">
                        <span>Last Updated</span>
                        <span className="text-xs">{new Date(tool.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    )}
                    {tool.sourceDetailUrl && (
                      <div className="flex items-center justify-between">
                        <span>Source</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1"
                          onClick={() => window.open(tool.sourceDetailUrl!, "_blank")}
                        >
                          <LinkIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {tool.badge && (
                      <div className="flex items-center justify-between"><span>Status</span><Badge variant="secondary">{tool.badge}</Badge></div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button className="w-full" size="lg" onClick={() => window.open(tool.websiteUrl, "_blank")} data-testid="button-visit-website">
                    Visit Website
                    <ExternalLink className="ml-2 h-5 w-5" />
                  </Button>
                </div>

                <Button variant="outline" className="w-full" onClick={sharePage}>
                  <Share2 className="h-4 w-4 mr-2" /> Share Tool Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { HeroSection } from "@/components/HeroSection";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ToolCard } from "@/components/ToolCard";
import { ThemeToggle } from "@/components/ThemeToggle";

const mockTools = [
  {
    id: "1",
    slug: "chatgpt",
    name: "ChatGPT",
    shortDescription: "Advanced AI assistant for conversations, writing, coding, and creative tasks",
    category: "Content AI",
    pricing: "Free / $20/mo",
    websiteUrl: "https://chat.openai.com",
    badge: "Featured",
    rating: 4.8,
  },
  {
    id: "2",
    slug: "midjourney",
    name: "Midjourney",
    shortDescription: "Create stunning AI-generated artwork from text descriptions",
    category: "Image AI",
    pricing: "$10-$60/mo",
    websiteUrl: "https://midjourney.com",
    badge: "Trending",
    rating: 4.9,
  },
  {
    id: "3",
    slug: "github-copilot",
    name: "GitHub Copilot",
    shortDescription: "AI-powered code completion and programming assistant",
    category: "Code AI",
    pricing: "$10/mo",
    websiteUrl: "https://github.com/features/copilot",
    badge: "Featured",
    rating: 4.7,
  },
  {
    id: "4",
    slug: "runway-ml",
    name: "Runway ML",
    shortDescription: "AI-powered video editing and generation tools",
    category: "Video AI",
    pricing: "Free / $12-$76/mo",
    websiteUrl: "https://runwayml.com",
    badge: "New",
    rating: 4.6,
  },
  {
    id: "5",
    slug: "jasper-ai",
    name: "Jasper AI",
    shortDescription: "AI writing assistant for marketing copy and content creation",
    category: "Marketing AI",
    pricing: "$39-$99/mo",
    websiteUrl: "https://jasper.ai",
    rating: 4.5,
  },
  {
    id: "6",
    slug: "dalle-3",
    name: "DALL-E 3",
    shortDescription: "Advanced AI image generation from OpenAI",
    category: "Image AI",
    pricing: "$20/mo (ChatGPT Plus)",
    websiteUrl: "https://openai.com/dall-e-3",
    badge: "Featured",
    rating: 4.8,
  },
  {
    id: "7",
    slug: "tableau-ai",
    name: "Tableau AI",
    shortDescription: "AI-powered data analytics and visualization platform",
    category: "Data AI",
    pricing: "$70-$840/year",
    websiteUrl: "https://tableau.com",
    rating: 4.7,
  },
  {
    id: "8",
    slug: "elevenlabs",
    name: "ElevenLabs",
    shortDescription: "Realistic AI voice generation and text-to-speech",
    category: "Voice AI",
    pricing: "Free / $5-$330/mo",
    websiteUrl: "https://elevenlabs.io",
    badge: "Trending",
    rating: 4.9,
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredTools = mockTools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
      tool.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">AI</span>
            </div>
            <span className="font-bold text-xl">AI Tools Directory</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main>
        <HeroSection onSearch={setSearchQuery} searchQuery={searchQuery} />

        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-8">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {selectedCategory === "all" ? "All AI Tools" : `${selectedCategory} Tools`}
            </h2>
            <span className="text-muted-foreground" data-testid="text-results-count">
              {filteredTools.length} tools found
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTools.map((tool) => (
              <Link key={tool.id} href={`/tools/${tool.slug}`}>
                <div>
                  <ToolCard
                    {...tool}
                    onViewDetails={() => {}}
                  />
                </div>
              </Link>
            ))}
          </div>

          {filteredTools.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No tools found. Try adjusting your search or filters.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Categories</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Content AI</li>
                <li>Image AI</li>
                <li>Video AI</li>
                <li>Code AI</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Blog</li>
                <li>Guides</li>
                <li>API</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About</li>
                <li>Contact</li>
                <li>Privacy</li>
                <li>Terms</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Twitter</li>
                <li>LinkedIn</li>
                <li>GitHub</li>
                <li>Discord</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2025 AI Tools Directory. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

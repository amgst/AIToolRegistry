import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { HeroSection } from "@/components/HeroSection";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ToolCard } from "@/components/ToolCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { AiTool } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: tools = [], isLoading } = useQuery<AiTool[]>({
    queryKey: ["/api/tools", searchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      
      const qs = params.toString();
      const url = qs ? `/api/tools?${qs}` : "/api/tools";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch tools");
      return response.json();
    },
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
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                Admin
              </span>
            </Link>
            <ThemeToggle />
          </div>
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
              {isLoading ? "Loading..." : `${tools.length} tools found`}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="h-64 bg-card border border-card-border rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tools.map((tool) => (
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

              {tools.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">
                    No tools found. Try adjusting your search or filters.
                  </p>
                </div>
              )}
            </>
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

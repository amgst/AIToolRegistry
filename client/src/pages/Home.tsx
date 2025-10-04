import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ToolCard } from "@/components/ToolCard";
import { ToolDetailModal } from "@/components/ToolDetailModal";
import { ThemeToggle } from "@/components/ThemeToggle";

const mockTools = [
  {
    id: "1",
    name: "ChatGPT",
    shortDescription: "Advanced AI assistant for conversations, writing, coding, and creative tasks",
    description: "ChatGPT is an advanced AI language model that can engage in natural conversations, help with writing tasks, answer questions, write code, and assist with creative projects. It uses cutting-edge natural language processing to understand context and provide helpful, accurate responses.",
    category: "Content AI",
    pricing: "Free / $20/mo",
    websiteUrl: "https://chat.openai.com",
    badge: "Featured",
    rating: 4.8,
    features: ["Natural language conversations", "Code generation and debugging", "Creative writing assistance", "Research and analysis", "Multi-language support"],
    tags: ["Chatbot", "Writing", "Coding", "Research", "GPT-4"]
  },
  {
    id: "2",
    name: "Midjourney",
    shortDescription: "Create stunning AI-generated artwork from text descriptions",
    description: "Midjourney is a powerful AI art generator that creates high-quality images from text prompts. Perfect for artists, designers, and creative professionals looking to bring their ideas to life.",
    category: "Image AI",
    pricing: "$10-$60/mo",
    websiteUrl: "https://midjourney.com",
    badge: "Trending",
    rating: 4.9,
    features: ["Text-to-image generation", "High-resolution outputs", "Style variations", "Commercial use license"],
    tags: ["Art", "Design", "Creative", "Images"]
  },
  {
    id: "3",
    name: "GitHub Copilot",
    shortDescription: "AI-powered code completion and programming assistant",
    description: "GitHub Copilot helps developers write code faster with AI-powered code suggestions. It understands context and provides intelligent completions for any programming language.",
    category: "Code AI",
    pricing: "$10/mo",
    websiteUrl: "https://github.com/features/copilot",
    badge: "Featured",
    rating: 4.7,
    features: ["AI code completion", "Multi-language support", "Context-aware suggestions", "IDE integration"],
    tags: ["Coding", "Development", "Programming", "Productivity"]
  },
  {
    id: "4",
    name: "Runway ML",
    shortDescription: "AI-powered video editing and generation tools",
    description: "Runway ML offers cutting-edge AI tools for video editing, including background removal, motion tracking, and AI-generated video content.",
    category: "Video AI",
    pricing: "Free / $12-$76/mo",
    websiteUrl: "https://runwayml.com",
    badge: "New",
    rating: 4.6,
    features: ["AI video editing", "Background removal", "Motion tracking", "Text-to-video"],
    tags: ["Video", "Editing", "Creative", "Production"]
  },
  {
    id: "5",
    name: "Jasper AI",
    shortDescription: "AI writing assistant for marketing copy and content creation",
    description: "Jasper AI is a comprehensive AI writing platform designed for marketers, helping create high-converting copy, blog posts, and marketing content.",
    category: "Marketing AI",
    pricing: "$39-$99/mo",
    websiteUrl: "https://jasper.ai",
    rating: 4.5,
    features: ["Marketing copy generation", "SEO optimization", "Template library", "Brand voice customization"],
    tags: ["Marketing", "Copywriting", "Content", "SEO"]
  },
  {
    id: "6",
    name: "DALL-E 3",
    shortDescription: "Advanced AI image generation from OpenAI",
    description: "DALL-E 3 creates highly detailed and accurate images from text descriptions. The latest version offers improved understanding and better image quality.",
    category: "Image AI",
    pricing: "$20/mo (ChatGPT Plus)",
    websiteUrl: "https://openai.com/dall-e-3",
    badge: "Featured",
    rating: 4.8,
    features: ["Text-to-image generation", "High accuracy", "ChatGPT integration", "Commercial rights"],
    tags: ["Images", "Art", "Creative", "OpenAI"]
  },
  {
    id: "7",
    name: "Tableau AI",
    shortDescription: "AI-powered data analytics and visualization platform",
    description: "Tableau AI combines powerful data analytics with AI-driven insights to help businesses make data-driven decisions faster.",
    category: "Data AI",
    pricing: "$70-$840/year",
    websiteUrl: "https://tableau.com",
    rating: 4.7,
    features: ["Data visualization", "AI insights", "Predictive analytics", "Dashboard creation"],
    tags: ["Analytics", "Data", "Business Intelligence", "Visualization"]
  },
  {
    id: "8",
    name: "ElevenLabs",
    shortDescription: "Realistic AI voice generation and text-to-speech",
    description: "ElevenLabs offers the most realistic AI voice generation technology, perfect for audiobooks, voiceovers, and content creation.",
    category: "Voice AI",
    pricing: "Free / $5-$330/mo",
    websiteUrl: "https://elevenlabs.io",
    badge: "Trending",
    rating: 4.9,
    features: ["Realistic voice cloning", "Text-to-speech", "Multiple languages", "Custom voice creation"],
    tags: ["Voice", "Audio", "TTS", "Speech"]
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTool, setSelectedTool] = useState<typeof mockTools[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTools = mockTools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
      tool.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const handleViewDetails = (id: string) => {
    const tool = mockTools.find((t) => t.id === id);
    if (tool) {
      setSelectedTool(tool);
      setIsModalOpen(true);
    }
  };

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
              <ToolCard
                key={tool.id}
                {...tool}
                onViewDetails={handleViewDetails}
              />
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

      <ToolDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tool={selectedTool}
      />
    </div>
  );
}

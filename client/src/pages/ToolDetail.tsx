import { useRoute, Link } from "wouter";
import { ArrowLeft, ExternalLink, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

const mockTools = [
  {
    id: "1",
    slug: "chatgpt",
    name: "ChatGPT",
    shortDescription: "Advanced AI assistant for conversations, writing, coding, and creative tasks",
    description: "ChatGPT is an advanced AI language model developed by OpenAI that can engage in natural conversations, help with writing tasks, answer questions, write code, and assist with creative projects. It uses cutting-edge natural language processing to understand context and provide helpful, accurate responses across a wide range of topics and use cases.",
    category: "Content AI",
    pricing: "Free / $20/mo",
    websiteUrl: "https://chat.openai.com",
    badge: "Featured",
    rating: 4.8,
    features: [
      "Natural language conversations with context awareness",
      "Code generation and debugging assistance",
      "Creative writing and content creation",
      "Research and detailed analysis",
      "Multi-language support (50+ languages)",
      "Context-aware responses up to 128k tokens"
    ],
    tags: ["Chatbot", "Writing", "Coding", "Research", "GPT-4", "AI Assistant"]
  },
  {
    id: "2",
    slug: "midjourney",
    name: "Midjourney",
    shortDescription: "Create stunning AI-generated artwork from text descriptions",
    description: "Midjourney is a powerful AI art generator that creates high-quality, stunning images from text prompts. Perfect for artists, designers, and creative professionals looking to bring their ideas to life with incredible detail and artistic style.",
    category: "Image AI",
    pricing: "$10-$60/mo",
    websiteUrl: "https://midjourney.com",
    badge: "Trending",
    rating: 4.9,
    features: [
      "Text-to-image generation with artistic styles",
      "High-resolution outputs up to 4K",
      "Style variations and iterations",
      "Commercial use license included",
      "Discord-based interface",
      "Advanced parameter controls"
    ],
    tags: ["Art", "Design", "Creative", "Images", "Text-to-Image"]
  },
  {
    id: "3",
    slug: "github-copilot",
    name: "GitHub Copilot",
    shortDescription: "AI-powered code completion and programming assistant",
    description: "GitHub Copilot is an AI pair programmer that helps developers write code faster with intelligent, context-aware code suggestions. It understands your code context and provides completions for any programming language, powered by OpenAI Codex.",
    category: "Code AI",
    pricing: "$10/mo",
    websiteUrl: "https://github.com/features/copilot",
    badge: "Featured",
    rating: 4.7,
    features: [
      "AI-powered code completion",
      "Multi-language support (dozens of languages)",
      "Context-aware suggestions",
      "IDE integration (VS Code, JetBrains, Neovim)",
      "Code explanation and documentation",
      "Security vulnerability detection"
    ],
    tags: ["Coding", "Development", "Programming", "Productivity", "IDE"]
  },
  {
    id: "4",
    slug: "runway-ml",
    name: "Runway ML",
    shortDescription: "AI-powered video editing and generation tools",
    description: "Runway ML offers cutting-edge AI tools for video editing, including background removal, motion tracking, AI-generated video content, and more. Transform your video production workflow with powerful AI capabilities.",
    category: "Video AI",
    pricing: "Free / $12-$76/mo",
    websiteUrl: "https://runwayml.com",
    badge: "New",
    rating: 4.6,
    features: [
      "AI video editing and enhancement",
      "Background removal and replacement",
      "Motion tracking and object detection",
      "Text-to-video generation",
      "Real-time collaboration",
      "Export in multiple formats"
    ],
    tags: ["Video", "Editing", "Creative", "Production", "AI Video"]
  },
  {
    id: "5",
    slug: "jasper-ai",
    name: "Jasper AI",
    shortDescription: "AI writing assistant for marketing copy and content creation",
    description: "Jasper AI is a comprehensive AI writing platform designed for marketers and content creators. It helps create high-converting copy, blog posts, social media content, and marketing materials with advanced AI technology.",
    category: "Marketing AI",
    pricing: "$39-$99/mo",
    websiteUrl: "https://jasper.ai",
    rating: 4.5,
    features: [
      "Marketing copy generation",
      "SEO optimization built-in",
      "50+ template library",
      "Brand voice customization",
      "Multi-language content creation",
      "Plagiarism checker"
    ],
    tags: ["Marketing", "Copywriting", "Content", "SEO", "Writing"]
  },
  {
    id: "6",
    slug: "dalle-3",
    name: "DALL-E 3",
    shortDescription: "Advanced AI image generation from OpenAI",
    description: "DALL-E 3 creates highly detailed and accurate images from text descriptions. The latest version from OpenAI offers improved understanding of nuanced requests and better image quality than ever before.",
    category: "Image AI",
    pricing: "$20/mo (ChatGPT Plus)",
    websiteUrl: "https://openai.com/dall-e-3",
    badge: "Featured",
    rating: 4.8,
    features: [
      "Text-to-image generation with high accuracy",
      "Improved prompt understanding",
      "ChatGPT integration for iterative creation",
      "Commercial rights included",
      "Multiple image variations",
      "High-resolution outputs"
    ],
    tags: ["Images", "Art", "Creative", "OpenAI", "Text-to-Image"]
  },
  {
    id: "7",
    slug: "tableau-ai",
    name: "Tableau AI",
    shortDescription: "AI-powered data analytics and visualization platform",
    description: "Tableau AI combines powerful data analytics with AI-driven insights to help businesses make data-driven decisions faster. Visualize complex data and uncover insights with intelligent recommendations.",
    category: "Data AI",
    pricing: "$70-$840/year",
    websiteUrl: "https://tableau.com",
    rating: 4.7,
    features: [
      "Data visualization and dashboards",
      "AI-powered insights and recommendations",
      "Predictive analytics",
      "Natural language queries",
      "Real-time data analysis",
      "Enterprise-grade security"
    ],
    tags: ["Analytics", "Data", "Business Intelligence", "Visualization", "BI"]
  },
  {
    id: "8",
    slug: "elevenlabs",
    name: "ElevenLabs",
    shortDescription: "Realistic AI voice generation and text-to-speech",
    description: "ElevenLabs offers the most realistic AI voice generation technology available. Perfect for audiobooks, voiceovers, content creation, and any project requiring high-quality voice synthesis.",
    category: "Voice AI",
    pricing: "Free / $5-$330/mo",
    websiteUrl: "https://elevenlabs.io",
    badge: "Trending",
    rating: 4.9,
    features: [
      "Realistic voice cloning",
      "High-quality text-to-speech",
      "Multiple languages and accents",
      "Custom voice creation",
      "Emotion and tone control",
      "API access for developers"
    ],
    tags: ["Voice", "Audio", "TTS", "Speech", "Voice Cloning"]
  },
];

export default function ToolDetail() {
  const [, params] = useRoute("/tools/:slug");
  const tool = mockTools.find((t) => t.slug === params?.slug);

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
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">About {tool.name}</h2>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {tool.description}
                    </p>
                  </div>

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
                </div>

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

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => window.open(tool.websiteUrl, "_blank")}
                  data-testid="button-visit-website"
                >
                  Visit Website
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

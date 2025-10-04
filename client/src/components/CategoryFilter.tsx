import { Sparkles, Image, Video, Code, TrendingUp, Database, Mic, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const categories = [
  { id: "all", name: "All Tools", icon: Sparkles },
  { id: "content", name: "Content AI", icon: FileText },
  { id: "image", name: "Image AI", icon: Image },
  { id: "video", name: "Video AI", icon: Video },
  { id: "code", name: "Code AI", icon: Code },
  { id: "marketing", name: "Marketing AI", icon: TrendingUp },
  { id: "data", name: "Data AI", icon: Database },
  { id: "voice", name: "Voice AI", icon: Mic },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;
        
        return (
          <Badge
            key={category.id}
            variant={isSelected ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap px-4 py-2 flex items-center gap-2 hover-elevate active-elevate-2"
            onClick={() => onCategoryChange(category.id)}
            data-testid={`button-category-${category.id}`}
          >
            <Icon className="h-4 w-4" />
            {category.name}
          </Badge>
        );
      })}
    </div>
  );
}

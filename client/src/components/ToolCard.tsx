import { ExternalLink, Star } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ToolCardProps {
  id: string;
  name: string;
  shortDescription: string;
  category: string;
  pricing: string;
  websiteUrl: string;
  badge?: string;
  rating?: number;
  onViewDetails: (id: string) => void;
}

export function ToolCard({
  id,
  name,
  shortDescription,
  category,
  pricing,
  badge,
  rating,
  onViewDetails,
}: ToolCardProps) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const getBadgeColor = (badgeText?: string) => {
    if (!badgeText) return "secondary";
    if (badgeText === "Featured") return "default";
    if (badgeText === "New") return "destructive";
    if (badgeText === "Trending") return "outline";
    return "secondary";
  };

  return (
    <Card className="relative flex flex-col h-full hover-elevate transition-all duration-300 hover:-translate-y-1">
      {badge && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant={getBadgeColor(badge)} className="text-xs">
            {badge}
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold mb-1 truncate" data-testid={`text-tool-name-${id}`}>
              {name}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
              {rating && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span>{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {shortDescription}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 pt-4">
        <span className="text-sm font-medium text-muted-foreground">
          {pricing}
        </span>
        <Button
          size="sm"
          onClick={() => onViewDetails(id)}
          data-testid={`button-view-details-${id}`}
        >
          View Details
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

import { X, ExternalLink, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ToolDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: {
    id: string;
    name: string;
    description: string;
    category: string;
    pricing: string;
    websiteUrl: string;
    features: string[];
    tags: string[];
    developer?: string;
    documentationUrl?: string;
    launchDate?: string;
    useCases?: string[];
    screenshots?: string[];
    socialLinks?: Record<string, string>;
    pricingDetails?: {
      pricingModel?: string;
      freeTrial?: boolean | string;
      freeTier?: {
        description?: string;
        limits?: string[];
        features?: string[];
      };
      plans?: Array<{
        name: string;
        price: string;
        period?: string;
        currency?: string;
        features?: string[];
        popular?: boolean;
      }>;
      notes?: string;
    };
  } | null;
}

export function ToolDetailModal({ isOpen, onClose, tool }: ToolDetailModalProps) {
  if (!tool) return null;

  const initials = tool.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-20 w-20 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-2xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <DialogTitle className="text-3xl mb-2" data-testid="text-modal-title">
                    {tool.name}
                  </DialogTitle>
                  <DialogDescription>
                    Detailed information and actions for {tool.name}.
                  </DialogDescription>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{tool.category}</Badge>
                    <Badge variant="secondary">{tool.pricing}</Badge>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  data-testid="button-close-modal"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
              </div>

              {tool.features.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Key Features</h3>
                  <ul className="space-y-2">
                    {tool.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tool.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tool.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {tool.pricingDetails && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Pricing Details</h3>
                  {tool.pricingDetails.pricingModel && (
                    <Badge variant="outline" className="mb-3">
                      {tool.pricingDetails.pricingModel}
                    </Badge>
                  )}
                  
                  {tool.pricingDetails.freeTrial && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium mb-1">Free Trial</h4>
                      <p className="text-sm text-muted-foreground">
                        {typeof tool.pricingDetails.freeTrial === "string"
                          ? tool.pricingDetails.freeTrial
                          : "Available"}
                      </p>
                    </div>
                  )}

                  {tool.pricingDetails.plans && tool.pricingDetails.plans.length > 0 && (
                    <div className="space-y-2">
                      {tool.pricingDetails.plans.map((plan, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{plan.name}</span>
                            {plan.popular && <Badge variant="default" className="text-xs">Popular</Badge>}
                          </div>
                          <p className="text-lg font-bold">
                            {plan.currency && plan.currency !== "USD" && `${plan.currency} `}
                            {plan.price}
                            {plan.period && <span className="text-sm font-normal">/{plan.period}</span>}
                          </p>
                          {plan.features && plan.features.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {plan.features.map((feature, fIdx) => (
                                <li key={fIdx} className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Check className="h-3 w-3 text-primary" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => window.open(tool.websiteUrl, "_blank")}
                  data-testid="button-visit-website"
                >
                  Visit Website
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

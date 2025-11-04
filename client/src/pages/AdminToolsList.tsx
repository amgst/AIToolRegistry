import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pencil, Trash2, ExternalLink, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminNavbar } from "@/components/AdminNavbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

export default function AdminToolsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTool, setEditingTool] = useState<AiTool | null>(null);
  const [editingCategory, setEditingCategory] = useState<string>("Content AI");
  const [deletingTool, setDeletingTool] = useState<AiTool | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: tools = [], isLoading } = useQuery<AiTool[]>({
    queryKey: ["/api/tools"],
    queryFn: async () => {
      const response = await fetch("/api/tools");
      if (!response.ok) throw new Error("Failed to fetch tools");
      return response.json();
    },
  });

  const filteredTools = tools.filter((tool) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tool.name.toLowerCase().includes(query) ||
      tool.description?.toLowerCase().includes(query) ||
      tool.category?.toLowerCase().includes(query) ||
      tool.slug.toLowerCase().includes(query)
    );
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/tools/${id}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      toast({
        title: "Success",
        description: "Tool deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setDeletingTool(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tool",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAiTool> }) => {
      const response = await apiRequest(`/api/tools/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      toast({
        title: "Success",
        description: "Tool updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingTool(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tool",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (tool: AiTool) => {
    setEditingTool(tool);
    setEditingCategory(tool.category || "Content AI");
    setIsEditDialogOpen(true);
  };

  const handleDelete = (tool: AiTool) => {
    setDeletingTool(tool);
    setIsDeleteDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTool) return;

    const formData = new FormData(e.currentTarget);
    
    const updates: Partial<InsertAiTool> = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      shortDescription: formData.get("shortDescription") as string,
      category: editingCategory,
      pricing: formData.get("pricing") as string,
      websiteUrl: formData.get("websiteUrl") as string,
      logoUrl: formData.get("logoUrl") as string || undefined,
    };

    updateMutation.mutate({ id: editingTool.id, data: updates });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <AdminNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Tools Management</h1>
          <p className="text-muted-foreground">
            Manage all tools in your database ({filteredTools.length} {filteredTools.length === 1 ? "tool" : "tools"})
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <Input
              placeholder="Search tools by name, description, category, or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Tools</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTools.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "No tools found matching your search." : "No tools found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Name</th>
                      <th className="text-left p-4 font-semibold">Category</th>
                      <th className="text-left p-4 font-semibold">Pricing</th>
                      <th className="text-left p-4 font-semibold">Website</th>
                      <th className="text-left p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTools.map((tool) => (
                      <tr key={tool.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="font-medium">{tool.name}</div>
                          {tool.shortDescription && (
                            <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {tool.shortDescription}
                            </div>
                          )}
                          {tool.badge && (
                            <Badge variant="secondary" className="mt-1">
                              {tool.badge}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">{tool.category || "N/A"}</td>
                        <td className="p-4">{tool.pricing || "Unknown"}</td>
                        <td className="p-4">
                          <a
                            href={tool.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            Visit
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(tool)}
                              className="gap-2"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(tool)}
                              className="gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tool</DialogTitle>
          </DialogHeader>
          {editingTool && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingTool.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select 
                    value={editingCategory}
                    onValueChange={setEditingCategory}
                  >
                    <SelectTrigger id="edit-category">
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
              </div>

              <div>
                <Label htmlFor="edit-shortDescription">Short Description *</Label>
                <Textarea
                  id="edit-shortDescription"
                  name="shortDescription"
                  defaultValue={editingTool.shortDescription || ""}
                  required
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingTool.description || ""}
                  required
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-pricing">Pricing *</Label>
                  <Input
                    id="edit-pricing"
                    name="pricing"
                    defaultValue={editingTool.pricing || "Unknown"}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-logoUrl">Logo URL</Label>
                  <Input
                    id="edit-logoUrl"
                    name="logoUrl"
                    type="url"
                    defaultValue={editingTool.logoUrl || ""}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-websiteUrl">Website URL *</Label>
                <Input
                  id="edit-websiteUrl"
                  name="websiteUrl"
                  type="url"
                  defaultValue={editingTool.websiteUrl}
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingTool(null);
                    setEditingCategory("Content AI");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingTool?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingTool) {
                  deleteMutation.mutate(deletingTool.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

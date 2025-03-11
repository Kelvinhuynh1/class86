import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImportantResource } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Flame,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Download,
} from "lucide-react";

export default function ImportantResourcesPage() {
  const { user, hasPermission } = useAuth();
  const [resources, setResources] = useState<ImportantResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newResource, setNewResource] = useState<Partial<ImportantResource>>({
    title: "",
    type: "link",
    url: "",
    notes: "",
  });
  const [editingResource, setEditingResource] =
    useState<ImportantResource | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      // Fetch resources from Supabase
      const { data, error } = await supabase
        .from("important_resources")
        .select("*");

      if (error) throw error;

      if (data) {
        // Transform to our ImportantResource type
        const transformedResources: ImportantResource[] = data.map(
          (resource) => ({
            id: resource.id,
            title: resource.title,
            type: resource.type as "link" | "file" | "image",
            url: resource.url,
            fileUrl: resource.file_url,
            notes: resource.notes,
            addedBy: resource.added_by,
            addedAt: resource.added_at,
          }),
        );

        setResources(transformedResources);
      } else {
        setResources(demoResources);
      }
    } catch (err) {
      console.error("Error fetching resources:", err);
      // Fallback to demo data
      setResources(demoResources);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = async () => {
    if (!newResource.title || !user) return;
    if (newResource.type === "link" && !newResource.url) return;
    if (
      (newResource.type === "file" || newResource.type === "image") &&
      !selectedFile
    )
      return;

    let fileUrl = "";

    // Upload file to Supabase Storage if selected
    if (
      selectedFile &&
      (newResource.type === "file" || newResource.type === "image")
    ) {
      try {
        // Use a single bucket for all files to simplify permissions
        const bucketName = "study_files";
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Skip bucket check - we'll use the existing bucket

        // Upload the file to Supabase storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: true, // Changed to true to overwrite if file exists
          });

        if (error) {
          console.error("Upload error:", error);
          throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        console.log("File uploaded successfully:", fileUrl);
      } catch (uploadError) {
        console.error("Error uploading file:", uploadError);
        alert(
          "Error uploading file: " +
            (uploadError.message || "Please try again."),
        );
        return;
      }
    }

    try {
      // Add resource to Supabase
      const { data, error } = await supabase
        .from("important_resources")
        .insert([
          {
            title: newResource.title,
            type: newResource.type,
            url: newResource.type === "link" ? newResource.url : null,
            file_url:
              newResource.type === "file" || newResource.type === "image"
                ? fileUrl
                : null,
            notes: newResource.notes || null,
            added_by: user.displayName,
            added_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.error("Error adding resource:", error);
        alert("Failed to add resource: " + error.message);
        return;
      }

      // If we got data back, use it
      if (data && data[0]) {
        const resource: ImportantResource = {
          id: data[0].id,
          title: data[0].title,
          type: data[0].type as "link" | "file" | "image",
          url: data[0].url,
          fileUrl: data[0].file_url,
          notes: data[0].notes,
          addedBy: data[0].added_by,
          addedAt: data[0].added_at,
        };

        // Update local state
        setResources([...resources, resource]);
        resetNewResource();
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error("Error adding resource:", error);
      alert("Failed to add resource. Please try again.");
    }
  };

  const resetNewResource = () => {
    setNewResource({
      title: "",
      type: "link",
      url: "",
      notes: "",
    });
    setSelectedFile(null);
  };

  const handleEditResource = async () => {
    if (!editingResource) return;

    try {
      // Update resource in Supabase
      const { error } = await supabase
        .from("important_resources")
        .update({
          title: editingResource.title,
          notes: editingResource.notes,
          url: editingResource.type === "link" ? editingResource.url : null,
        })
        .eq("id", editingResource.id);

      if (error) throw error;

      // Update local state
      setResources(
        resources.map((resource) =>
          resource.id === editingResource.id ? editingResource : resource,
        ),
      );
      setEditingResource(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating resource:", error);
      // Fallback: just update local state
      setResources(
        resources.map((resource) =>
          resource.id === editingResource.id ? editingResource : resource,
        ),
      );
      setEditingResource(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    // Allow Leaders and Co-Leaders to delete resources too
    if (!hasPermission(["Leader", "Co-Leader", "Admin"])) {
      console.log("You don't have permission to delete resources");
      return;
    }

    try {
      // Delete resource from Supabase
      const { error } = await supabase
        .from("important_resources")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setResources(resources.filter((resource) => resource.id !== id));
    } catch (error) {
      console.error("Error deleting resource:", error);
      // Fallback: just update local state
      setResources(resources.filter((resource) => resource.id !== id));
    }
  };

  const startEditResource = (resource: ImportantResource) => {
    if (!hasPermission(["Leader", "Co-Leader", "Admin"])) return;
    setEditingResource({ ...resource });
    setIsEditDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getResourceIcon = (type: "link" | "file" | "image") => {
    switch (type) {
      case "link":
        return <ExternalLink className="h-10 w-10 text-blue-500" />;
      case "file":
        return <FileText className="h-10 w-10 text-green-500" />;
      case "image":
        return <ImageIcon className="h-10 w-10 text-purple-500" />;
    }
  };

  const filteredResources =
    activeTab === "all"
      ? resources
      : resources.filter((resource) => resource.type === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout activeTab="important">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Important Resources
            </h1>
            <p className="text-muted-foreground">
              Essential materials and references for your class.
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Important Resource</DialogTitle>
                <DialogDescription>
                  Add an essential resource for your class.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="resourceTitle">Title</Label>
                  <Input
                    id="resourceTitle"
                    placeholder="Resource title"
                    value={newResource.title}
                    onChange={(e) =>
                      setNewResource({
                        ...newResource,
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resourceType">Resource Type</Label>
                  <Select
                    value={newResource.type}
                    onValueChange={(value) =>
                      setNewResource({
                        ...newResource,
                        type: value as "link" | "file" | "image",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="file">File</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newResource.type === "link" ? (
                  <div className="space-y-2">
                    <Label htmlFor="resourceUrl">URL</Label>
                    <Input
                      id="resourceUrl"
                      placeholder="https://..."
                      value={newResource.url}
                      onChange={(e) =>
                        setNewResource({
                          ...newResource,
                          url: e.target.value,
                        })
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="resourceFile">
                      {newResource.type === "image" ? "Image" : "File"}
                    </Label>
                    <Input
                      id="resourceFile"
                      type="file"
                      accept={
                        newResource.type === "image" ? "image/*" : undefined
                      }
                      onChange={handleFileChange}
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="resourceNotes">Notes (Optional)</Label>
                  <Textarea
                    id="resourceNotes"
                    placeholder="Additional information about this resource"
                    value={newResource.notes}
                    onChange={(e) =>
                      setNewResource({
                        ...newResource,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddResource}
                  disabled={
                    !newResource.title ||
                    (newResource.type === "link" && !newResource.url) ||
                    ((newResource.type === "file" ||
                      newResource.type === "image") &&
                      !selectedFile)
                  }
                >
                  Add Resource
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="link">Links</TabsTrigger>
            <TabsTrigger value="file">Files</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources.length === 0 ? (
                <div className="col-span-full text-center p-12 border rounded-lg bg-muted/50">
                  <Flame className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No resources found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    There are no important resources in this category yet.
                  </p>
                  {hasPermission(["Leader", "Co-Leader", "Admin"]) && (
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Add Resource
                    </Button>
                  )}
                </div>
              ) : (
                filteredResources.map((resource) => (
                  <Card key={resource.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {resource.title}
                        </CardTitle>
                        {hasPermission(["Leader", "Co-Leader", "Admin"]) && (
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditResource(resource)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteResource(resource.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <CardDescription>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {resource.type.charAt(0).toUpperCase() +
                            resource.type.slice(1)}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center justify-center py-4">
                        {getResourceIcon(resource.type)}
                      </div>
                      {resource.notes && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {resource.notes}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Added by {resource.addedBy} on{" "}
                        {formatDate(resource.addedAt)}
                      </div>
                    </CardContent>
                    <CardFooter>
                      {resource.type === "link" && resource.url && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => window.open(resource.url, "_blank")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" /> Open Link
                        </Button>
                      )}
                      {(resource.type === "file" ||
                        resource.type === "image") &&
                        resource.fileUrl && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              window.open(resource.fileUrl, "_blank")
                            }
                          >
                            <Download className="mr-2 h-4 w-4" /> Download
                          </Button>
                        )}
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Resource Dialog */}
        {editingResource && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Resource</DialogTitle>
                <DialogDescription>
                  Update resource information and details.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-resourceTitle">Title</Label>
                  <Input
                    id="edit-resourceTitle"
                    value={editingResource.title}
                    onChange={(e) =>
                      setEditingResource({
                        ...editingResource,
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                {editingResource.type === "link" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-resourceUrl">URL</Label>
                    <Input
                      id="edit-resourceUrl"
                      value={editingResource.url}
                      onChange={(e) =>
                        setEditingResource({
                          ...editingResource,
                          url: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="edit-resourceNotes">Notes (Optional)</Label>
                  <Textarea
                    id="edit-resourceNotes"
                    value={editingResource.notes}
                    onChange={(e) =>
                      setEditingResource({
                        ...editingResource,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditResource}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}

// Demo data for fallback when Supabase connection fails
const demoResources: ImportantResource[] = [
  {
    id: "1",
    title: "Class Syllabus",
    type: "file",
    fileUrl: "https://example.com/files/syllabus.pdf",
    notes: "Complete course syllabus with all topics and assignments",
    addedBy: "Admin",
    addedAt: "2023-05-01T10:00:00Z",
  },
  {
    id: "2",
    title: "School Calendar",
    type: "link",
    url: "https://example.com/calendar",
    notes: "Official school calendar with all important dates",
    addedBy: "Admin",
    addedAt: "2023-05-02T11:30:00Z",
  },
  {
    id: "3",
    title: "Class Rules",
    type: "file",
    fileUrl: "https://example.com/files/rules.pdf",
    notes: "Classroom rules and expectations",
    addedBy: "Leader",
    addedAt: "2023-05-03T09:15:00Z",
  },
  {
    id: "4",
    title: "Classroom Map",
    type: "image",
    fileUrl: "https://example.com/images/map.jpg",
    notes: "Seating arrangement and classroom layout",
    addedBy: "Co-Leader",
    addedAt: "2023-05-04T14:20:00Z",
  },
  {
    id: "5",
    title: "Online Learning Portal",
    type: "link",
    url: "https://example.com/portal",
    notes: "Access to all online learning materials",
    addedBy: "Admin",
    addedAt: "2023-05-05T16:45:00Z",
  },
  {
    id: "6",
    title: "Emergency Procedures",
    type: "file",
    fileUrl: "https://example.com/files/emergency.pdf",
    notes: "Safety protocols and emergency procedures",
    addedBy: "Admin",
    addedAt: "2023-05-06T08:30:00Z",
  },
];

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StudyLink } from "@/types";
import { ExternalLink, Plus, Edit, Trash2 } from "lucide-react";

export default function StudyLinksPage() {
  const { user } = useAuth();
  const [links, setLinks] = useState<StudyLink[]>([]);

  const [newLink, setNewLink] = useState({
    title: "",
    url: "",
    description: "",
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();

    // Set up real-time subscription for new links
    const subscription = supabase
      .channel("study_links_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "study_links" },
        (payload) => {
          const newLink = payload.new as any;
          // Transform to our StudyLink type
          const link: StudyLink = {
            id: newLink.id,
            title: newLink.title,
            url: newLink.url,
            description: newLink.description,
            addedBy: newLink.added_by,
            addedAt: newLink.added_at,
          };
          setLinks((prev) => [...prev, link]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("study_links")
        .select("*")
        .order("added_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Transform to our StudyLink type
        const transformedLinks: StudyLink[] = data.map((link) => ({
          id: link.id,
          title: link.title,
          url: link.url,
          description: link.description,
          addedBy: link.added_by,
          addedAt: link.added_at,
        }));

        setLinks(transformedLinks);
      }
    } catch (err) {
      console.error("Error fetching links:", err);
      // Set demo data if fetch fails
      setLinks([
        {
          id: "1",
          title: "Blooket - Fun Learning Games & Quizzes",
          url: "https://www.blooket.com/",
          description: "Interactive learning platform with games and quizzes",
          addedBy: "John Doe",
          addedAt: "2023-05-15T10:30:00Z",
        },
        {
          id: "2",
          title: "Quizlet - Learning tools & flashcards",
          url: "https://quizlet.com/",
          description: "Study with flashcards, games and learning tools",
          addedBy: "Jane Smith",
          addedAt: "2023-05-10T14:20:00Z",
        },
        {
          id: "3",
          title: "Khan Academy",
          url: "https://www.khanacademy.org/",
          description: "Free world-class education for anyone, anywhere",
          addedBy: "Admin",
          addedAt: "2023-05-05T09:15:00Z",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!user) return;
    if (!newLink.title || !newLink.url) return;

    try {
      // Insert link into Supabase
      const { data, error } = await supabase
        .from("study_links")
        .insert([
          {
            title: newLink.title,
            url: newLink.url,
            description: newLink.description || null,
            added_by: user.displayName,
            added_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.error("Error adding link:", error);
        alert("Failed to add link: " + error.message);
        return;
      }

      // If we got data back, use it
      if (data && data[0]) {
        const link: StudyLink = {
          id: data[0].id,
          title: data[0].title,
          url: data[0].url,
          description: data[0].description,
          addedBy: data[0].added_by,
          addedAt: data[0].added_at,
        };

        // Just set the new link without adding to the array
        // The real-time subscription will handle adding it
        setNewLink({ title: "", url: "", description: "" });
        setIsDialogOpen(false);
      }
    } catch (err) {
      console.error("Error adding link:", err);
      alert("Failed to add link. Please try again.");
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

  return (
    <DashboardLayout activeTab="study-links">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Study Links</h1>
            <p className="text-muted-foreground">
              Useful links for studying and learning resources.
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Study Link</DialogTitle>
                <DialogDescription>
                  Share a useful resource with your classmates.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Khan Academy Math"
                    value={newLink.title}
                    onChange={(e) =>
                      setNewLink({ ...newLink, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    placeholder="https://..."
                    value={newLink.url}
                    onChange={(e) =>
                      setNewLink({ ...newLink, url: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Briefly describe this resource..."
                    value={newLink.description}
                    onChange={(e) =>
                      setNewLink({ ...newLink, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddLink}
                  disabled={!newLink.title || !newLink.url}
                >
                  Add Link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Card key={link.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-start justify-between">
                  <span className="line-clamp-1">{link.title}</span>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setNewLink({
                          title: link.title,
                          url: link.url,
                          description: link.description || "",
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        // Delete without confirmation
                        supabase
                          .from("study_links")
                          .delete()
                          .eq("id", link.id)
                          .then(() => {
                            setLinks(links.filter((l) => l.id !== link.id));
                          });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="line-clamp-1">
                  {link.url}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {link.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {link.description}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  Added by {link.addedBy} on {formatDate(link.addedAt)}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(link.url, "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Open Link
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

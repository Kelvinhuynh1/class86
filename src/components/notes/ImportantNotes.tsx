import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Star, Trash2 } from "lucide-react";

interface ImportantNote {
  id: string;
  noteId: string;
  content: string;
  subject: string;
  createdBy: string;
  createdAt: string;
}

export default function ImportantNotes() {
  const { user, hasPermission } = useAuth();
  const [notes, setNotes] = useState<ImportantNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImportantNotes();
  }, []);

  const fetchImportantNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("important_notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Transform to our ImportantNote type
        const transformedNotes: ImportantNote[] = data.map((note) => ({
          id: note.id,
          noteId: note.note_id,
          content: note.content,
          subject: note.subject,
          createdBy: note.created_by,
          createdAt: note.created_at,
        }));

        setNotes(transformedNotes);
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.error("Error fetching important notes:", err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id: string, noteId: string) => {
    if (!hasPermission(["Leader", "Co-Leader", "Admin"])) return;

    try {
      // Delete from important_notes table
      const { error: importantError } = await supabase
        .from("important_notes")
        .delete()
        .eq("id", id);

      if (importantError) throw importantError;

      // Update the daily_notes table to mark as not important
      const { error: dailyError } = await supabase
        .from("daily_notes")
        .update({ is_important: false })
        .eq("id", noteId);

      if (dailyError) throw dailyError;

      // Update local state
      setNotes(notes.filter((note) => note.id !== id));
    } catch (err) {
      console.error("Error deleting important note:", err);
    }
  };

  const canEditNotes = hasPermission(["Leader", "Co-Leader", "Admin"]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        <h2 className="text-xl font-semibold">Important Notes</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {notes.length === 0 ? (
          <div className="col-span-2 text-center p-6 border rounded-md bg-muted/50">
            <p className="text-muted-foreground">
              No important notes yet. Mark notes as important to see them here.
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="overflow-hidden border-yellow-300">
              <div className="h-1 bg-yellow-300"></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-500 fill-yellow-500" />
                    {note.subject}
                  </CardTitle>
                  {canEditNotes && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteNote(note.id, note.noteId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardDescription>
                  Added by {note.createdBy} on{" "}
                  {format(new Date(note.createdAt), "MMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{note.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

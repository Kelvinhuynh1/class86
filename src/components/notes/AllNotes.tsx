import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { BookMarked, Search, Calendar, Clock } from "lucide-react";

interface Note {
  id: string;
  content: string;
  subject: string;
  created_by: string;
  date: string;
  is_important: boolean;
  created_at: string;
}

export default function AllNotes() {
  const { user, hasPermission } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    fetchNotes();
    fetchSubjects();

    // Set up realtime subscription
    const subscription = supabase
      .channel("daily_notes_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_notes" },
        () => fetchNotes(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      // Fetch all notes from the daily_notes table
      const { data, error } = await supabase
        .from("daily_notes")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      setNotes(data || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("name")
        .order("name");

      if (error) throw error;

      if (data) {
        // Remove duplicates by using a Set
        const uniqueSubjects = [
          ...new Set(data.map((subject) => subject.name)),
        ];
        setSubjects(uniqueSubjects);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "h:mm a");
    } catch (e) {
      return "";
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.created_by.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = subjectFilter
      ? note.subject === subjectFilter
      : true;

    return matchesSearch && matchesSubject;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            className="w-full sm:w-auto px-3 py-2 rounded-md border border-input bg-background text-sm"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center p-12 border rounded-lg">
          <BookMarked className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">No notes found</h3>
          <p className="text-muted-foreground">
            {searchQuery || subjectFilter
              ? "Try adjusting your search or filter criteria."
              : "There are no notes available yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${note.created_by}`}
                        />
                        <AvatarFallback>
                          {note.created_by.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{note.created_by}</div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span className="mr-2">{formatDate(note.date)}</span>
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatTime(note.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {note.subject}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <p className="whitespace-pre-wrap">{note.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

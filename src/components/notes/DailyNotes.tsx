import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO, addDays, subDays } from "date-fns";
import {
  Plus,
  Edit,
  Trash2,
  Star,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DailyNote {
  id: string;
  content: string;
  subject: string;
  date: string;
  createdBy: string;
  isImportant: boolean;
}

interface DailyNotesProps {
  initialDate?: string;
}

export default function DailyNotes({ initialDate }: DailyNotesProps) {
  const { user, hasPermission } = useAuth();
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split("T")[0],
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState<Partial<DailyNote>>({
    content: "",
    subject: "",
    isImportant: false,
  });
  const [editingNote, setEditingNote] = useState<DailyNote | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectColors, setSubjectColors] = useState<Record<string, string>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);

  // Get today's timetable subjects
  useEffect(() => {
    // Clear subjects when date changes to avoid showing previous day's subjects
    setSubjects([]);
    fetchSubjectsForDate(selectedDate);
    fetchNotes();
    fetchSubjectColors();

    // Set up realtime subscriptions
    const notesSubscription = supabase
      .channel("daily_notes_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_notes" },
        () => fetchNotes(),
      )
      .subscribe();

    const subjectsSubscription = supabase
      .channel("subjects_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subjects" },
        () => fetchSubjectsForDate(selectedDate),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notesSubscription);
      supabase.removeChannel(subjectsSubscription);
    };
  }, [selectedDate]);

  const fetchSubjectColors = async () => {
    try {
      // First try to get colors from subjects table
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("name, color")
        .order("name", { ascending: true });

      if (!subjectsError && subjectsData && subjectsData.length > 0) {
        // Create a map of subject to color
        const colorMap: Record<string, string> = {};
        subjectsData.forEach((subject: any) => {
          if (subject.name && subject.color) {
            colorMap[subject.name] = subject.color;
          } else if (subject.name) {
            colorMap[subject.name] = getDefaultSubjectColor(subject.name);
          }
        });
        setSubjectColors(colorMap);
        return;
      }

      // Fallback to timetable slots if subjects table doesn't have colors
      const { data, error } = await supabase
        .from("timetable_slots")
        .select("subject, color")
        .order("subject", { ascending: true });

      if (error) throw error;

      // Create a map of subject to color
      const colorMap: Record<string, string> = {};
      data.forEach((slot: any) => {
        if (slot.subject && !colorMap[slot.subject]) {
          colorMap[slot.subject] =
            slot.color || getDefaultSubjectColor(slot.subject);
        }
      });

      setSubjectColors(colorMap);

      // Update the subjects table with these colors
      for (const subject in colorMap) {
        await supabase
          .from("subjects")
          .update({ color: colorMap[subject] })
          .eq("name", subject)
          .catch((e) =>
            console.error(`Failed to update color for ${subject}:`, e),
          );
      }
    } catch (err) {
      console.error("Error fetching subject colors:", err);
    }
  };

  const fetchSubjectsForDate = async (dateStr: string) => {
    try {
      // Clear subjects first to avoid showing stale data
      setSubjects([]);

      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const dayName = days[dayOfWeek];

      // For weekdays, get the day's schedule
      if (dayName !== "Saturday" && dayName !== "Sunday") {
        // Fetch timetable slots for the day, ordered by start time
        const { data: dayData, error: dayError } = await supabase
          .from("timetable_slots")
          .select("subject, start_time, color")
          .eq("day", dayName)
          .order("start_time", { ascending: true });

        console.log(`Fetched timetable for ${dayName}:`, dayData);

        if (!dayError && dayData && dayData.length > 0) {
          // Extract subjects in order of appearance in the day
          const daySubjects: string[] = [];
          const subjectColorMap: Record<string, string> = {};

          dayData.forEach((slot: any) => {
            if (slot.subject && !daySubjects.includes(slot.subject)) {
              daySubjects.push(slot.subject);
              if (slot.color) {
                subjectColorMap[slot.subject] = slot.color;
              }
            }
          });

          // Add General to the list if not already there
          if (!daySubjects.includes("General")) {
            daySubjects.push("General");
          }

          // Update subject colors state
          setSubjectColors((prev) => ({ ...prev, ...subjectColorMap }));

          // Set the subjects for the day
          setSubjects(daySubjects);
          return;
        }
      }

      // Fallback: fetch all subjects from the subjects table
      const { data: allSubjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .order("name", { ascending: true });

      if (!subjectsError && allSubjectsData && allSubjectsData.length > 0) {
        // Use subjects from the database
        const allSubjects = allSubjectsData.map((s) => s.name);

        // Make sure General is included
        if (!allSubjects.includes("General")) {
          allSubjects.push("General");
        }

        setSubjects(allSubjects);
      } else {
        // Last resort fallback to demo subjects
        const demoSubjects = [
          "Tiếng Pháp",
          "Thể dục",
          "Tiếng Anh",
          "Khoa học máy tính",
          "Công nghệ",
          "Well-being",
          "General",
        ];
        setSubjects(demoSubjects);
      }
    } catch (err) {
      console.error("Error in fetchSubjectsForDate:", err);
      // Fallback to demo subjects
      const demoSubjects = [
        "Tiếng Pháp",
        "Thể dục",
        "Tiếng Anh",
        "Khoa học máy tính",
        "Công nghệ",
        "Well-being",
        "General",
      ];
      setSubjects(demoSubjects);
    }
  };

  const fetchNotes = async () => {
    setLoading(true);
    try {
      // Format date for query
      const dateForQuery = new Date(selectedDate).toISOString();

      // Fetch notes for the selected date
      const { data, error } = await supabase
        .from("daily_notes")
        .select("*")
        .gte("date", dateForQuery.split("T")[0] + "T00:00:00")
        .lt("date", dateForQuery.split("T")[0] + "T23:59:59");

      if (error) throw error;

      if (data) {
        // Transform to our DailyNote type
        const transformedNotes: DailyNote[] = data.map((note) => ({
          id: note.id,
          content: note.content,
          subject: note.subject,
          date: note.date,
          createdBy: note.created_by,
          isImportant: note.is_important,
        }));

        setNotes(transformedNotes);
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.content || !newNote.subject || !user) return;

    try {
      setError(null);

      // Prepare note data for Supabase
      const note = {
        content: newNote.content,
        subject: newNote.subject,
        date: new Date(selectedDate).toISOString(),
        created_by: user.displayName,
        is_important: newNote.isImportant || false,
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from("daily_notes")
        .insert([note])
        .select();

      if (error) {
        setError(`Failed to save note: ${error.message}`);
        return;
      }

      // If note is marked as important, also add to important_notes
      if (newNote.isImportant && data && data[0]) {
        await supabase.from("important_notes").insert([
          {
            note_id: data[0].id,
            content: newNote.content,
            subject: newNote.subject,
            created_by: user.displayName,
          },
        ]);
      }

      // Ensure the subject exists and update its timestamp
      try {
        // First check if subject exists
        const { data: subjectData, error: subjectError } = await supabase
          .from("subjects")
          .select("id")
          .eq("name", newNote.subject)
          .maybeSingle();

        if (subjectError) {
          console.error("Error checking subject:", subjectError);
        }

        if (!subjectData) {
          // Subject doesn't exist, create it
          await supabase
            .from("subjects")
            .insert({
              name: newNote.subject,
              color: getDefaultSubjectColor(newNote.subject),
              updated_at: new Date().toISOString(),
            })
            .catch((e) => console.error("Failed to create subject:", e));
        } else {
          // Subject exists, update timestamp
          await supabase
            .from("subjects")
            .update({
              updated_at: new Date().toISOString(),
            })
            .eq("name", newNote.subject)
            .catch((e) =>
              console.error("Failed to update subject timestamp:", e),
            );
        }
      } catch (subjectErr) {
        console.error("Error updating subject:", subjectErr);
      }

      // Reset form
      setNewNote({
        content: "",
        subject: "",
        isImportant: false,
      });
      setIsAddDialogOpen(false);

      // Fetch notes to update the UI
      fetchNotes();
    } catch (err) {
      console.error("Error adding note:", err);
      setError(`Failed to save note: ${err.message || "Unknown error"}`);
    }
  };

  const handleEditNote = async () => {
    if (!editingNote || !user) return;

    try {
      // Check if importance status changed
      const wasImportant = notes.find(
        (n) => n.id === editingNote.id,
      )?.isImportant;
      const isNowImportant = editingNote.isImportant;

      // Update note in Supabase
      const { error } = await supabase
        .from("daily_notes")
        .update({
          content: editingNote.content,
          subject: editingNote.subject,
          is_important: editingNote.isImportant,
        })
        .eq("id", editingNote.id);

      if (error) throw error;

      // Update local state
      setNotes(
        notes.map((note) => (note.id === editingNote.id ? editingNote : note)),
      );

      // Handle important notes table
      if (!wasImportant && isNowImportant) {
        // Add to important notes
        await supabase.from("important_notes").insert([
          {
            note_id: editingNote.id,
            content: editingNote.content,
            subject: editingNote.subject,
            created_by: user.displayName,
            created_at: new Date().toISOString(),
          },
        ]);
      } else if (wasImportant && !isNowImportant) {
        // Remove from important notes
        await supabase
          .from("important_notes")
          .delete()
          .eq("note_id", editingNote.id);
      } else if (wasImportant && isNowImportant) {
        // Update important note
        await supabase
          .from("important_notes")
          .update({
            content: editingNote.content,
            subject: editingNote.subject,
          })
          .eq("note_id", editingNote.id);
      }

      // Update subject in subjects table
      try {
        await supabase
          .from("subjects")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("name", editingNote.subject);
      } catch (subjectErr) {
        console.error("Error updating subject timestamp:", subjectErr);
      }

      setEditingNote(null);
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating note:", err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      // Check if note is important
      const isImportant = notes.find((n) => n.id === id)?.isImportant;
      const noteSubject = notes.find((n) => n.id === id)?.subject;

      // Delete note from Supabase
      const { error } = await supabase
        .from("daily_notes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // If it was important, also delete from important_notes
      if (isImportant) {
        await supabase.from("important_notes").delete().eq("note_id", id);
      }

      // Update subject in subjects table
      if (noteSubject) {
        try {
          await supabase
            .from("subjects")
            .update({
              updated_at: new Date().toISOString(),
            })
            .eq("name", noteSubject);
        } catch (subjectErr) {
          console.error("Error updating subject timestamp:", subjectErr);
        }
      }

      // Update local state
      setNotes(notes.filter((note) => note.id !== id));
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  const startEditNote = (note: DailyNote) => {
    setEditingNote({ ...note });
    setIsEditDialogOpen(true);
  };

  const canEditNotes = hasPermission(["Leader", "Co-Leader", "Admin"]);

  const getSubjectColor = (subject: string): string => {
    // Return the color from the subjectColors map or a default color
    if (subject === "General") {
      return "bg-slate-100 border-slate-200";
    }
    return subjectColors[subject] || getDefaultSubjectColor(subject);
  };

  const getDefaultSubjectColor = (subject: string): string => {
    // Map subjects to colors (fallback)
    const colorMap: Record<string, string> = {
      Toán: "bg-blue-100 border-blue-200",
      "CĐBS Toán": "bg-blue-100 border-blue-200",
      "Khoa học": "bg-green-100 border-green-200",
      "CDBS KHTN": "bg-green-100 border-green-200",
      "Tiếng Anh": "bg-yellow-100 border-yellow-200",
      "Ngữ văn": "bg-yellow-100 border-yellow-200",
      "Lịch sử": "bg-purple-100 border-purple-200",
      "Địa lý": "bg-indigo-100 border-indigo-200",
      "Lịch sử/Địa lý": "bg-purple-100 border-purple-200",
      "Mĩ thuật": "bg-pink-100 border-pink-200",
      "Thể dục": "bg-orange-100 border-orange-200",
      "Tiếng Pháp": "bg-red-100 border-red-200",
      "Khoa học máy tính": "bg-cyan-100 border-cyan-200",
      "Công nghệ": "bg-cyan-100 border-cyan-200",
      "Âm nhạc": "bg-fuchsia-100 border-fuchsia-200",
      "Viễn cảnh toàn cầu": "bg-violet-100 border-violet-200",
      GDCD: "bg-violet-100 border-violet-200",
      GDĐP: "bg-amber-100 border-amber-200",
      HĐTNHN: "bg-emerald-100 border-emerald-200",
      "Well-being": "bg-rose-100 border-rose-200",
      SHCN: "bg-slate-100 border-slate-200",
    };

    return colorMap[subject] || "bg-gray-100 border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Daily Notes</h2>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const prevDay = subDays(new Date(selectedDate), 1);
              setSelectedDate(prevDay.toISOString().split("T")[0]);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const nextDay = addDays(new Date(selectedDate), 1);
              setSelectedDate(nextDay.toISOString().split("T")[0]);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {canEditNotes && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Daily Note</DialogTitle>
                  <DialogDescription>
                    Add a note for{" "}
                    {format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <select
                      id="subject"
                      className="w-full p-2 border rounded-md"
                      value={newNote.subject}
                      onChange={(e) =>
                        setNewNote({ ...newNote, subject: e.target.value })
                      }
                    >
                      <option value="">Select a subject</option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Note Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter your note here..."
                      value={newNote.content}
                      onChange={(e) =>
                        setNewNote({ ...newNote, content: e.target.value })
                      }
                      rows={4}
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-destructive">{error}</div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="important"
                      checked={newNote.isImportant}
                      onCheckedChange={(checked) =>
                        setNewNote({
                          ...newNote,
                          isImportant: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="important" className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-500" /> Mark as
                      important
                    </Label>
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
                    onClick={handleAddNote}
                    disabled={!newNote.content || !newNote.subject}
                  >
                    Add Note
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="bg-muted p-3 border-b flex justify-between items-center">
          <h3 className="font-medium">
            {format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
          </h3>
          {canEditNotes && (
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Note
            </Button>
          )}
        </div>

        <div className="divide-y">
          {subjects.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No classes scheduled for this day
            </div>
          ) : (
            subjects.map((subject, index) => {
              const subjectNotes = notes.filter(
                (note) => note.subject === subject,
              );
              const subjectColor = getSubjectColor(subject);

              return (
                <div
                  key={`subject-${subject}-${index}`}
                  className="p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${subjectColor}`}
                    >
                      {subject}
                    </div>
                    {canEditNotes && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setNewNote({
                            ...newNote,
                            subject: subject,
                          });
                          setIsAddDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    )}
                  </div>

                  {subjectNotes.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic pl-2">
                      No notes for this subject
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {subjectNotes.map((note) => (
                        <div
                          key={note.id}
                          className={`p-3 rounded-md border ${note.isImportant ? "border-yellow-300 bg-yellow-50/30" : "bg-card"}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              {note.isImportant && (
                                <Star className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500" />
                              )}
                              <span className="text-sm font-medium">
                                Note by {note.createdBy}
                              </span>
                            </div>
                            {canEditNotes && (
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => startEditNote(note)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => handleDeleteNote(note.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap mt-1 text-sm">
                            {note.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Note Dialog */}
      {editingNote && canEditNotes && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
              <DialogDescription>
                Update note for{" "}
                {format(new Date(editingNote.date), "EEEE, MMMM d, yyyy")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-subject">Subject</Label>
                <select
                  id="edit-subject"
                  className="w-full p-2 border rounded-md"
                  value={editingNote.subject}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, subject: e.target.value })
                  }
                >
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                  <option value="General">General</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">Note Content</Label>
                <Textarea
                  id="edit-content"
                  value={editingNote.content}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, content: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-important"
                  checked={editingNote.isImportant}
                  onCheckedChange={(checked) =>
                    setEditingNote({
                      ...editingNote,
                      isImportant: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="edit-important" className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-500" /> Mark as
                  important
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditNote}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

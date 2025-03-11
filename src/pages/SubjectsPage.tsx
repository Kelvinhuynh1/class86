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
import { Label } from "@/components/ui/label";
import { Subject } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Edit,
  Trash2,
  BookMarked,
  Clock,
  Pencil,
  Star,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";

interface SubjectWithId extends Subject {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  noteCount?: number;
}

interface SubjectNote {
  id: string;
  content: string;
  subject: string;
  createdBy: string;
  date: string;
  isImportant: boolean;
}

export default function SubjectsPage() {
  const { user, hasPermission } = useAuth();
  const [subjects, setSubjects] = useState<SubjectWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState<Partial<SubjectWithId>>({
    name: "",
    color: "#3b82f6", // Default blue color
    notes: "",
  });
  const [editingSubject, setEditingSubject] = useState<SubjectWithId | null>(
    null,
  );
  const [subjectNotes, setSubjectNotes] = useState<
    Record<string, SubjectNote[]>
  >({});
  const [selectedSubject, setSelectedSubject] = useState<SubjectWithId | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const colorOptions = [
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" },
    { name: "Red", value: "#ef4444" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Yellow", value: "#f59e0b" },
    { name: "Pink", value: "#ec4899" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Orange", value: "#f97316" },
    { name: "Lime", value: "#84cc16" },
    { name: "Cyan", value: "#06b6d4" },
    { name: "Fuchsia", value: "#d946ef" },
  ];

  useEffect(() => {
    fetchSubjects();

    // Set up realtime subscription for subjects changes
    const subjectsSubscription = supabase
      .channel("subjects_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subjects" },
        () => {
          fetchSubjects();
        },
      )
      .subscribe();

    // Set up realtime subscription for notes changes
    const notesSubscription = supabase
      .channel("daily_notes_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_notes" },
        () => {
          if (subjects.length > 0) {
            fetchNotesForSubjects(subjects);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subjectsSubscription);
      supabase.removeChannel(notesSubscription);
    };
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      // Check if subjects table exists, if not create it
      const { error: checkError } = await supabase
        .from("subjects")
        .select("id")
        .limit(1);

      if (checkError && checkError.code === "42P01") {
        // Table doesn't exist, run the migration
        console.log("Subjects table doesn't exist, creating it...");
        const { error: rpcError } = await supabase.rpc("create_subjects_table");
        if (rpcError) {
          console.error("Failed to create subjects table:", rpcError);
        }
      }

      // Fetch subjects from Supabase
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching subjects:", error);
        await fetchSubjectsFromTimetable();
        return;
      }

      if (data && data.length > 0) {
        // Transform to our Subject type
        const transformedSubjects: SubjectWithId[] = data.map((subject) => ({
          id: subject.id,
          name: subject.name,
          color: subject.color || "#3b82f6",
          notes: subject.notes,
          createdAt: subject.created_at,
          updatedAt: subject.updated_at,
        }));

        setSubjects(transformedSubjects);
        fetchNotesForSubjects(transformedSubjects);
      } else {
        await fetchSubjectsFromTimetable();
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
      await fetchSubjectsFromTimetable();
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsFromTimetable = async () => {
    try {
      // Get unique subjects from timetable
      const { data, error } = await supabase
        .from("timetable_slots")
        .select("subject, color")
        .order("subject", { ascending: true });

      if (error) throw error;

      if (data) {
        // Extract unique subjects
        const uniqueSubjects = Array.from(
          new Set(data.map((slot: any) => slot.subject)),
        );

        // Create subject objects
        const transformedSubjects: SubjectWithId[] = [];

        for (const subject of uniqueSubjects) {
          if (!subject) continue;

          const subjectData = data.find(
            (slot: any) => slot.subject === subject,
          );
          const color = subjectData?.color || getRandomColor();

          // Try to insert into database
          const { data: insertedData, error: insertError } = await supabase
            .from("subjects")
            .insert({
              name: subject,
              color: color,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (insertError && insertError.code !== "23505") {
            // Ignore unique violation
            console.error(`Error inserting subject ${subject}:`, insertError);
          }

          transformedSubjects.push({
            id: insertedData?.id || `temp-${Date.now()}-${subject}`,
            name: subject,
            color: color,
            notes: null,
            createdAt: new Date().toISOString(),
            updatedAt: null,
          });
        }

        setSubjects(transformedSubjects);
        fetchNotesForSubjects(transformedSubjects);
      }
    } catch (err) {
      console.error("Error fetching subjects from timetable:", err);
      setSubjects(demoSubjects);
    }
  };

  const fetchNotesForSubjects = async (subjectsList: SubjectWithId[]) => {
    try {
      const notesMap: Record<string, SubjectNote[]> = {};
      const noteCounts: Record<string, number> = {};

      // Fetch notes count for each subject
      for (const subject of subjectsList) {
        const { count, error: countError } = await supabase
          .from("daily_notes")
          .select("*", { count: "exact", head: true })
          .eq("subject", subject.name);

        if (!countError) {
          noteCounts[subject.name] = count || 0;
        }

        // Fetch recent notes for each subject
        const { data, error } = await supabase
          .from("daily_notes")
          .select("*")
          .eq("subject", subject.name)
          .order("date", { ascending: false })
          .limit(5);

        if (!error && data && data.length > 0) {
          notesMap[subject.name] = data.map((note) => ({
            id: note.id,
            content: note.content,
            subject: note.subject,
            createdBy: note.created_by,
            date: note.date,
            isImportant: note.is_important,
          }));
        } else {
          notesMap[subject.name] = [];
        }
      }

      // Update subjects with note counts
      setSubjects((prev) =>
        prev.map((subject) => ({
          ...subject,
          noteCount: noteCounts[subject.name] || 0,
        })),
      );

      setSubjectNotes(notesMap);
    } catch (err) {
      console.error("Error fetching notes for subjects:", err);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.name.trim() || !user) return;

    try {
      // Add subject to Supabase
      const { data, error } = await supabase
        .from("subjects")
        .insert([
          {
            name: newSubject.name,
            color: newSubject.color,
            notes: newSubject.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.error("Error adding subject:", error);
        // If the error is a duplicate key error, try to update instead
        if (error.code === "23505") {
          // Unique violation
          const { data: updateData, error: updateError } = await supabase
            .from("subjects")
            .update({
              color: newSubject.color,
              notes: newSubject.notes || null,
              updated_at: new Date().toISOString(),
            })
            .eq("name", newSubject.name)
            .select();

          if (updateError) throw updateError;

          if (updateData && updateData[0]) {
            // Add to local state
            const updatedSubject: SubjectWithId = {
              id: updateData[0].id,
              name: updateData[0].name,
              color: updateData[0].color,
              notes: updateData[0].notes,
              createdAt: updateData[0].created_at,
              updatedAt: updateData[0].updated_at,
            };

            setSubjects(
              subjects.map((s) =>
                s.name === updatedSubject.name ? updatedSubject : s,
              ),
            );
            // Reset form and close dialog
            setNewSubject({
              name: "",
              color: "#3b82f6",
              notes: "",
            });
            setIsAddDialogOpen(false);
            return;
          }
        } else {
          throw error;
        }
      }

      if (data && data[0]) {
        // Add to local state
        const newSubjectWithId: SubjectWithId = {
          id: data[0].id,
          name: data[0].name,
          color: data[0].color,
          notes: data[0].notes,
          createdAt: data[0].created_at,
          updatedAt: data[0].updated_at,
          noteCount: 0,
        };

        setSubjects([...subjects, newSubjectWithId]);
        setSubjectNotes({
          ...subjectNotes,
          [newSubjectWithId.name]: [],
        });
        setSelectedSubject(newSubjectWithId);
      }

      // Reset form
      setNewSubject({
        name: "",
        color: "#3b82f6",
        notes: "",
      });
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error("Error adding subject:", err);
    }
  };

  const handleEditSubject = async () => {
    if (!editingSubject || !editingSubject.name.trim()) return;

    try {
      // Update subject in Supabase
      const { error } = await supabase
        .from("subjects")
        .update({
          name: editingSubject.name,
          color: editingSubject.color,
          notes: editingSubject.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingSubject.id);

      if (error) throw error;

      // Update local state
      const updatedSubjects = subjects.map((subject) =>
        subject.id === editingSubject.id ? editingSubject : subject,
      );

      setSubjects(updatedSubjects);

      if (selectedSubject?.id === editingSubject.id) {
        setSelectedSubject(editingSubject);
      }

      // Reset editing state
      setEditingSubject(null);
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating subject:", err);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      const subjectToDelete = subjects.find((s) => s.id === id);
      if (!subjectToDelete) return;

      // Delete subject from Supabase
      const { error } = await supabase.from("subjects").delete().eq("id", id);

      if (error) throw error;

      // Update local state
      setSubjects(subjects.filter((subject) => subject.id !== id));

      if (selectedSubject?.id === id) {
        setSelectedSubject(null);
      }

      // Remove from notes map
      const newSubjectNotes = { ...subjectNotes };
      delete newSubjectNotes[subjectToDelete.name];
      setSubjectNotes(newSubjectNotes);
    } catch (err) {
      console.error("Error deleting subject:", err);
    }
  };

  const startEditSubject = (subject: SubjectWithId) => {
    setEditingSubject({ ...subject });
    setIsEditDialogOpen(true);
  };

  const canEditSubjects = hasPermission(["Leader", "Co-Leader", "Admin"]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRandomColor = () => {
    return colorOptions[Math.floor(Math.random() * colorOptions.length)].value;
  };

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <DashboardLayout activeTab="subjects">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="subjects">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
            <p className="text-muted-foreground">
              View and manage class subjects and their notes.
            </p>
          </div>

          {canEditSubjects && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                  <DialogDescription>
                    Create a new subject for your class.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="subjectName">Subject Name</Label>
                    <Input
                      id="subjectName"
                      placeholder="e.g. Mathematics"
                      value={newSubject.name}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subjectColor">Color</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {colorOptions.map((color) => (
                        <div
                          key={color.value}
                          className={`w-full h-8 rounded-md cursor-pointer border-2 ${newSubject.color === color.value ? "border-primary ring-2 ring-primary ring-opacity-50" : "border-transparent"}`}
                          style={{ backgroundColor: color.value }}
                          onClick={() =>
                            setNewSubject({ ...newSubject, color: color.value })
                          }
                        ></div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subjectNotes">Notes (Optional)</Label>
                    <Textarea
                      id="subjectNotes"
                      placeholder="Additional information about this subject"
                      value={newSubject.notes || ""}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, notes: e.target.value })
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
                    onClick={handleAddSubject}
                    disabled={!newSubject.name.trim()}
                  >
                    Add Subject
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5 lg:col-span-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredSubjects.length === 0 ? (
                <div className="col-span-full p-6 text-center border rounded-lg bg-muted/20">
                  <BookMarked className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">
                    No subjects found
                  </h3>
                  {canEditSubjects && (
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Subject
                    </Button>
                  )}
                </div>
              ) : (
                filteredSubjects.map((subject) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    className={`cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all ${selectedSubject?.id === subject.id ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedSubject(subject)}
                    style={{ backgroundColor: subject.color + "15" }} // Light version of the color
                  >
                    <div
                      className="h-2"
                      style={{ backgroundColor: subject.color }}
                    ></div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: subject.color }}
                          ></div>
                          <h3 className="font-semibold text-lg truncate">
                            {subject.name}
                          </h3>
                        </div>
                        {canEditSubjects && (
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditSubject(subject);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubject(subject.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-muted-foreground">
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        <span>{subject.noteCount || 0} notes</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="md:col-span-7 lg:col-span-8">
            {selectedSubject ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl overflow-hidden shadow-lg"
                style={{ backgroundColor: selectedSubject.color + "10" }} // Very light version of the color
              >
                <div
                  className="h-2"
                  style={{ backgroundColor: selectedSubject.color }}
                ></div>
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div
                      className="w-6 h-6 rounded-full mr-3"
                      style={{ backgroundColor: selectedSubject.color }}
                    ></div>
                    <h2 className="text-2xl font-bold">
                      {selectedSubject.name}
                    </h2>
                  </div>

                  {selectedSubject.notes && (
                    <div className="mb-6 p-4 rounded-lg bg-background/80">
                      <p className="italic text-muted-foreground">
                        {selectedSubject.notes}
                      </p>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Pencil
                        className="h-5 w-5 mr-2"
                        style={{ color: selectedSubject.color }}
                      />
                      Recent Notes
                    </h3>

                    {!subjectNotes[selectedSubject.name] ||
                    subjectNotes[selectedSubject.name].length === 0 ? (
                      <div className="text-center p-8 rounded-lg bg-background/80 border border-dashed">
                        <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          No notes available for this subject
                        </p>
                        {canEditSubjects && (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => {
                              window.location.href = `/notes?subject=${selectedSubject.name}`;
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Add Note
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {subjectNotes[selectedSubject.name].map((note) => (
                          <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`p-4 rounded-lg bg-background/80 border ${note.isImportant ? "border-yellow-300" : "border-transparent"} shadow-sm`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                {note.isImportant && (
                                  <Star className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500" />
                                )}
                                <span className="font-medium">
                                  {note.createdBy}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {formatDate(note.date)}
                                </span>
                              </div>
                            </div>
                            <p className="whitespace-pre-wrap text-sm">
                              {note.content}
                            </p>
                          </motion.div>
                        ))}

                        {(selectedSubject.noteCount || 0) >
                          subjectNotes[selectedSubject.name].length && (
                          <Button
                            variant="ghost"
                            className="w-full text-muted-foreground"
                            onClick={() => {
                              window.location.href = `/notes?subject=${selectedSubject.name}`;
                            }}
                          >
                            View all {selectedSubject.noteCount} notes
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <div>
                      Created:{" "}
                      {selectedSubject.createdAt
                        ? formatDate(selectedSubject.createdAt)
                        : "Unknown"}
                    </div>
                    <div>
                      Last updated:{" "}
                      {selectedSubject.updatedAt
                        ? formatDate(selectedSubject.updatedAt)
                        : "Never"}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border rounded-xl bg-muted/10">
                <div className="text-center max-w-md">
                  <BookMarked className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-xl font-medium mb-2">Select a subject</h3>
                  <p className="text-muted-foreground mb-6">
                    Choose a subject from the list to view its details and
                    recent notes
                  </p>
                  {canEditSubjects && subjects.length === 0 && (
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Add Subject
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Subject Dialog */}
        {editingSubject && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Subject</DialogTitle>
                <DialogDescription>
                  Update subject details and appearance
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-subjectName">Subject Name</Label>
                  <Input
                    id="edit-subjectName"
                    value={editingSubject.name}
                    onChange={(e) =>
                      setEditingSubject({
                        ...editingSubject,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-subjectColor">Color</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {colorOptions.map((color) => (
                      <div
                        key={color.value}
                        className={`w-full h-8 rounded-md cursor-pointer border-2 ${editingSubject.color === color.value ? "border-primary ring-2 ring-primary ring-opacity-50" : "border-transparent"}`}
                        style={{ backgroundColor: color.value }}
                        onClick={() =>
                          setEditingSubject({
                            ...editingSubject,
                            color: color.value,
                          })
                        }
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-subjectNotes">Notes (Optional)</Label>
                  <Textarea
                    id="edit-subjectNotes"
                    value={editingSubject.notes || ""}
                    onChange={(e) =>
                      setEditingSubject({
                        ...editingSubject,
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
                <Button
                  onClick={handleEditSubject}
                  disabled={!editingSubject.name.trim()}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}

// Demo data for fallback when Supabase connection fails
const demoSubjects: SubjectWithId[] = [
  {
    id: "1",
    name: "Mathematics",
    color: "#3b82f6",
    notes:
      "Core mathematics curriculum including algebra, geometry, and calculus",
    noteCount: 5,
  },
  {
    id: "2",
    name: "Science",
    color: "#10b981",
    notes: "General science covering physics, chemistry, and biology",
    noteCount: 3,
  },
  {
    id: "3",
    name: "English",
    color: "#f59e0b",
    notes: "Language arts, literature, and composition",
    noteCount: 4,
  },
  {
    id: "4",
    name: "History",
    color: "#8b5cf6",
    notes: "World and national history studies",
    noteCount: 2,
  },
  {
    id: "5",
    name: "Art",
    color: "#ec4899",
    notes: "Visual arts and creative expression",
    noteCount: 1,
  },
];

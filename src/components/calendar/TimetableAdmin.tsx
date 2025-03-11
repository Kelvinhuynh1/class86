import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimetableSlot, Break } from "@/types/calendar";
import { supabase } from "@/lib/supabase";
import { Plus, Edit, Trash2, Clock } from "lucide-react";

export default function TimetableAdmin() {
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("timetable");

  // For adding/editing timetable slots
  const [isAddSlotDialogOpen, setIsAddSlotDialogOpen] = useState(false);
  const [isEditSlotDialogOpen, setIsEditSlotDialogOpen] = useState(false);
  const [newSlot, setNewSlot] = useState<Partial<TimetableSlot>>({
    day: "Monday",
    timeSlot: { start: "08:00", end: "09:00" },
    subject: "",
    room: "",
    teacher: "",
  });
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);

  // For adding/editing breaks
  const [isAddBreakDialogOpen, setIsAddBreakDialogOpen] = useState(false);
  const [isEditBreakDialogOpen, setIsEditBreakDialogOpen] = useState(false);
  const [newBreak, setNewBreak] = useState<Partial<Break>>({
    name: "",
    timeSlot: { start: "10:00", end: "10:30" },
  });
  const [editingBreak, setEditingBreak] = useState<Break | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch timetable slots from Supabase
      const { data: slotsData, error: slotsError } = await supabase
        .from("timetable_slots")
        .select("*");

      if (slotsError) throw slotsError;

      // Transform data to match our types
      const transformedSlots: TimetableSlot[] = slotsData.map((slot: any) => ({
        id: slot.id,
        day: slot.day,
        timeSlot: {
          start: slot.start_time,
          end: slot.end_time,
        },
        subject: slot.subject,
        teacher: slot.teacher || undefined,
        room: slot.room || undefined,
        color: slot.color || undefined,
      }));

      // Fetch breaks from Supabase
      const { data: breaksData, error: breaksError } = await supabase
        .from("breaks")
        .select("*");

      if (breaksError) throw breaksError;

      // Transform breaks data
      const transformedBreaks: Break[] = breaksData.map((breakItem: any) => ({
        id: breakItem.id,
        name: breakItem.name,
        timeSlot: {
          start: breakItem.start_time,
          end: breakItem.end_time,
        },
      }));

      setTimetableSlots(transformedSlots);
      setBreaks(transformedBreaks);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    if (!newSlot.subject || !newSlot.day || !newSlot.timeSlot) return;

    try {
      // Add slot to Supabase
      const { data, error } = await supabase
        .from("timetable_slots")
        .insert([
          {
            day: newSlot.day,
            start_time: newSlot.timeSlot.start,
            end_time: newSlot.timeSlot.end,
            subject: newSlot.subject,
            teacher: newSlot.teacher || null,
            room: newSlot.room || null,
            color: newSlot.color || null,
          },
        ])
        .select();

      if (error) throw error;

      // Transform the returned data
      const newSlotData: TimetableSlot = {
        id: data[0].id,
        day: data[0].day,
        timeSlot: {
          start: data[0].start_time,
          end: data[0].end_time,
        },
        subject: data[0].subject,
        teacher: data[0].teacher || undefined,
        room: data[0].room || undefined,
        color: data[0].color || undefined,
      };

      // Update local state
      setTimetableSlots([...timetableSlots, newSlotData]);
      resetNewSlot();
      setIsAddSlotDialogOpen(false);
    } catch (error) {
      console.error("Error adding timetable slot:", error);
    }
  };

  const handleEditSlot = async () => {
    if (!editingSlot) return;

    try {
      // Update slot in Supabase
      const { error } = await supabase
        .from("timetable_slots")
        .update({
          day: editingSlot.day,
          start_time: editingSlot.timeSlot.start,
          end_time: editingSlot.timeSlot.end,
          subject: editingSlot.subject,
          teacher: editingSlot.teacher || null,
          room: editingSlot.room || null,
          color: editingSlot.color || null,
        })
        .eq("id", editingSlot.id);

      if (error) throw error;

      // Update local state
      setTimetableSlots(
        timetableSlots.map((slot) =>
          slot.id === editingSlot.id ? editingSlot : slot,
        ),
      );
      setEditingSlot(null);
      setIsEditSlotDialogOpen(false);
    } catch (error) {
      console.error("Error updating timetable slot:", error);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      // Delete slot from Supabase
      const { error } = await supabase
        .from("timetable_slots")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setTimetableSlots(timetableSlots.filter((slot) => slot.id !== id));
    } catch (error) {
      console.error("Error deleting timetable slot:", error);
    }
  };

  const handleAddBreak = async () => {
    if (!newBreak.name || !newBreak.timeSlot) return;

    try {
      // Add break to Supabase
      const { data, error } = await supabase
        .from("breaks")
        .insert([
          {
            name: newBreak.name,
            start_time: newBreak.timeSlot.start,
            end_time: newBreak.timeSlot.end,
          },
        ])
        .select();

      if (error) throw error;

      // Transform the returned data
      const newBreakData: Break = {
        id: data[0].id,
        name: data[0].name,
        timeSlot: {
          start: data[0].start_time,
          end: data[0].end_time,
        },
      };

      // Update local state
      setBreaks([...breaks, newBreakData]);
      resetNewBreak();
      setIsAddBreakDialogOpen(false);
    } catch (error) {
      console.error("Error adding break:", error);
    }
  };

  const handleEditBreak = async () => {
    if (!editingBreak) return;

    try {
      // Update break in Supabase
      const { error } = await supabase
        .from("breaks")
        .update({
          name: editingBreak.name,
          start_time: editingBreak.timeSlot.start,
          end_time: editingBreak.timeSlot.end,
        })
        .eq("id", editingBreak.id);

      if (error) throw error;

      // Update local state
      setBreaks(
        breaks.map((breakItem) =>
          breakItem.id === editingBreak.id ? editingBreak : breakItem,
        ),
      );
      setEditingBreak(null);
      setIsEditBreakDialogOpen(false);
    } catch (error) {
      console.error("Error updating break:", error);
    }
  };

  const handleDeleteBreak = async (id: string) => {
    try {
      // Delete break from Supabase
      const { error } = await supabase.from("breaks").delete().eq("id", id);

      if (error) throw error;

      // Update local state
      setBreaks(breaks.filter((breakItem) => breakItem.id !== id));
    } catch (error) {
      console.error("Error deleting break:", error);
    }
  };

  const resetNewSlot = () => {
    setNewSlot({
      day: "Monday",
      timeSlot: { start: "08:00", end: "09:00" },
      subject: "",
      room: "",
      teacher: "",
    });
  };

  const resetNewBreak = () => {
    setNewBreak({
      name: "",
      timeSlot: { start: "10:00", end: "10:30" },
    });
  };

  const startEditSlot = (slot: TimetableSlot) => {
    setEditingSlot({ ...slot });
    setIsEditSlotDialogOpen(true);
  };

  const startEditBreak = (breakItem: Break) => {
    setEditingBreak({ ...breakItem });
    setIsEditBreakDialogOpen(true);
  };

  const handleTimeSlotChange = (field: 'start' | 'end', value: string) => {
    setNewSlot({
      ...newSlot,
      timeSlot: {
        start: field === 'start' ? value : (newSlot.timeSlot?.start || "08:00"),
        end: field === 'end' ? value : (newSlot.timeSlot?.end || "09:00"),
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timetable Administration</CardTitle>
        <CardDescription>
          Manage class timetable, subjects, and breaks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="timetable"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timetable">Timetable Slots</TabsTrigger>
            <TabsTrigger value="breaks">Breaks</TabsTrigger>
          </TabsList>

          {/* Timetable Slots Tab */}
          <TabsContent value="timetable" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Class Schedule</h3>
              <Dialog
                open={isAddSlotDialogOpen}
                onOpenChange={setIsAddSlotDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Timetable Slot
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Timetable Slot</DialogTitle>
                    <DialogDescription>
                      Add a new class to the weekly schedule
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="day">Day</Label>
                      <Select
                        value={newSlot.day}
                        onValueChange={(value) =>
                          setNewSlot({ ...newSlot, day: value as any })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monday">Monday</SelectItem>
                          <SelectItem value="Tuesday">Tuesday</SelectItem>
                          <SelectItem value="Wednesday">Wednesday</SelectItem>
                          <SelectItem value="Thursday">Thursday</SelectItem>
                          <SelectItem value="Friday">Friday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={newSlot.timeSlot?.start || "08:00"}
                          onChange={(e) => handleTimeSlotChange('start', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={newSlot.timeSlot?.end || "09:00"}
                          onChange={(e) => handleTimeSlotChange('end', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="e.g. Mathematics"
                        value={newSlot.subject}
                        onChange={(e) =>
                          setNewSlot({ ...newSlot, subject: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacher">Teacher (Optional)</Label>
                      <Input
                        id="teacher"
                        placeholder="e.g. Mr. Smith"
                        value={newSlot.teacher}
                        onChange={(e) =>
                          setNewSlot({ ...newSlot, teacher: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="room">Room (Optional)</Label>
                      <Input
                        id="room"
                        placeholder="e.g. Room 101"
                        value={newSlot.room}
                        onChange={(e) =>
                          setNewSlot({ ...newSlot, room: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddSlotDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddSlot} disabled={!newSlot.subject}>
                      Add Slot
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timetableSlots.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-4 text-muted-foreground"
                      >
                        No timetable slots found. Add one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    timetableSlots
                      .sort((a, b) => {
                        // Sort by day first
                        const days = [
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                        ];
                        const dayDiff =
                          days.indexOf(a.day) - days.indexOf(b.day);
                        if (dayDiff !== 0) return dayDiff;

                        // Then sort by start time
                        const aStart = a.timeSlot.start.split(":").map(Number);
                        const bStart = b.timeSlot.start.split(":").map(Number);
                        return (
                          aStart[0] * 60 +
                          aStart[1] -
                          (bStart[0] * 60 + bStart[1])
                        );
                      })
                      .map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell>{slot.day}</TableCell>
                          <TableCell>
                            {slot.timeSlot.start} - {slot.timeSlot.end}
                          </TableCell>
                          <TableCell className="font-medium">
                            {slot.subject}
                          </TableCell>
                          <TableCell>{slot.teacher || "-"}</TableCell>
                          <TableCell>{slot.room || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditSlot(slot)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDeleteSlot(slot.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Breaks Tab */}
          <TabsContent value="breaks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Break Times</h3>
              <Dialog
                open={isAddBreakDialogOpen}
                onOpenChange={setIsAddBreakDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Break
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Break</DialogTitle>
                    <DialogDescription>
                      Add a new break period to the schedule
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="breakName">Break Name</Label>
                      <Input
                        id="breakName"
                        placeholder="e.g. Morning Break"
                        value={newBreak.name}
                        onChange={(e) =>
                          setNewBreak({ ...newBreak, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="breakStartTime">Start Time</Label>
                        <Input
                          id="breakStartTime"
                          type="time"
                          value={newBreak.timeSlot?.start}
                          onChange={(e) =>
                            setNewBreak({
                              ...newBreak,
                              timeSlot: {
                                ...(newBreak.timeSlot || {}),
                                start: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="breakEndTime">End Time</Label>
                        <Input
                          id="breakEndTime"
                          type="time"
                          value={newBreak.timeSlot?.end}
                          onChange={(e) =>
                            setNewBreak({
                              ...newBreak,
                              timeSlot: {
                                ...(newBreak.timeSlot || {}),
                                end: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddBreakDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddBreak} disabled={!newBreak.name}>
                      Add Break
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Break Name</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breaks.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-4 text-muted-foreground"
                      >
                        No breaks found. Add one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    breaks
                      .sort((a, b) => {
                        // Sort by start time
                        const aStart = a.timeSlot.start.split(":").map(Number);
                        const bStart = b.timeSlot.start.split(":").map(Number);
                        return (
                          aStart[0] * 60 +
                          aStart[1] -
                          (bStart[0] * 60 + bStart[1])
                        );
                      })
                      .map((breakItem) => (
                        <TableRow key={breakItem.id}>
                          <TableCell className="font-medium">
                            {breakItem.name}
                          </TableCell>
                          <TableCell>
                            {breakItem.timeSlot.start} -{" "}
                            {breakItem.timeSlot.end}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditBreak(breakItem)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDeleteBreak(breakItem.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Edit Timetable Slot Dialog */}
      {editingSlot && (
        <Dialog
          open={isEditSlotDialogOpen}
          onOpenChange={setIsEditSlotDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Timetable Slot</DialogTitle>
              <DialogDescription>
                Update class schedule information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-day">Day</Label>
                <Select
                  value={editingSlot.day}
                  onValueChange={(value) =>
                    setEditingSlot({ ...editingSlot, day: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                    <SelectItem value="Thursday">Thursday</SelectItem>
                    <SelectItem value="Friday">Friday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={editingSlot.timeSlot.start}
                    onChange={(e) =>
                      setEditingSlot({
                        ...editingSlot,
                        timeSlot: {
                          ...editingSlot.timeSlot,
                          start: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={editingSlot.timeSlot.end}
                    onChange={(e) =>
                      setEditingSlot({
                        ...editingSlot,
                        timeSlot: {
                          ...editingSlot.timeSlot,
                          end: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-subject">Subject</Label>
                <Input
                  id="edit-subject"
                  value={editingSlot.subject}
                  onChange={(e) =>
                    setEditingSlot({ ...editingSlot, subject: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-teacher">Teacher (Optional)</Label>
                <Input
                  id="edit-teacher"
                  value={editingSlot.teacher || ""}
                  onChange={(e) =>
                    setEditingSlot({ ...editingSlot, teacher: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-room">Room (Optional)</Label>
                <Input
                  id="edit-room"
                  value={editingSlot.room || ""}
                  onChange={(e) =>
                    setEditingSlot({ ...editingSlot, room: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditSlotDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditSlot}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Break Dialog */}
      {editingBreak && (
        <Dialog
          open={isEditBreakDialogOpen}
          onOpenChange={setIsEditBreakDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Break</DialogTitle>
              <DialogDescription>
                Update break time information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-breakName">Break Name</Label>
                <Input
                  id="edit-breakName"
                  value={editingBreak.name}
                  onChange={(e) =>
                    setEditingBreak({ ...editingBreak, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-breakStartTime">Start Time</Label>
                  <Input
                    id="edit-breakStartTime"
                    type="time"
                    value={editingBreak.timeSlot.start}
                    onChange={(e) =>
                      setEditingBreak({
                        ...editingBreak,
                        timeSlot: {
                          ...editingBreak.timeSlot,
                          start: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-breakEndTime">End Time</Label>
                  <Input
                    id="edit-breakEndTime"
                    type="time"
                    value={editingBreak.timeSlot.end}
                    onChange={(e) =>
                      setEditingBreak({
                        ...editingBreak,
                        timeSlot: {
                          ...editingBreak.timeSlot,
                          end: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditBreakDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditBreak}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

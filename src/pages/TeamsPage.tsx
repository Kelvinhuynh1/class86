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
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  BookOpen,
  MessageSquare,
  LogOut,
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  members: string[];
  notes?: string;
  subjects?: string[];
  isPrivate?: boolean;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface User {
  id: string;
  displayName: string;
  role: string;
  classCode?: string;
}

export default function TeamsPage() {
  const { user, hasPermission } = useAuth();
  const [publicTeams, setPublicTeams] = useState<Team[]>([]);
  const [privateTeams, setPrivateTeams] = useState<Team[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("public");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddPrivateDialogOpen, setIsAddPrivateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditPrivateDialogOpen, setIsEditPrivateDialogOpen] = useState(false);
  const [newTeam, setNewTeam] = useState<Partial<Team>>({
    name: "",
    members: [],
    notes: "",
    subjects: [],
  });
  const [newPrivateTeam, setNewPrivateTeam] = useState<Partial<Team>>({
    name: "",
    members: [],
    notes: "",
    subjects: [],
    isPrivate: true,
    owner: user?.id || "",
  });
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingPrivateTeam, setEditingPrivateTeam] = useState<Team | null>(
    null,
  );
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPrivateTeam, setSelectedPrivateTeam] = useState<Team | null>(
    null,
  );
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch public teams
      const { data: publicTeamsData, error: publicTeamsError } = await supabase
        .from("teams")
        .select("*")
        .eq("is_private", false);

      if (publicTeamsError) throw publicTeamsError;

      // Fetch private teams where user is a member or owner
      const { data: privateTeamsData, error: privateTeamsError } =
        await supabase
          .from("teams")
          .select("*")
          .eq("is_private", true)
          .or(`members.cs.{${user?.id}},owner.eq.${user?.id}`);

      if (privateTeamsError) throw privateTeamsError;

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("users")
        .select("*");

      if (studentsError) throw studentsError;

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("name");

      if (subjectsError) {
        // Fallback to default subjects
        setAvailableSubjects(defaultSubjects);
      } else {
        const subjectNames = subjectsData?.map((subject) => subject.name) || [];
        // Remove duplicates using Set
        const uniqueSubjects = [...new Set(subjectNames)];
        setAvailableSubjects(
          uniqueSubjects.length > 0 ? uniqueSubjects : defaultSubjects,
        );
      }

      // Transform data
      const transformedPublicTeams: Team[] =
        publicTeamsData?.map((team) => ({
          id: team.id,
          name: team.name,
          members: team.members || [],
          notes: team.notes || "",
          subjects: team.subjects || [],
          isPrivate: false,
          owner: team.owner,
          createdAt: team.created_at,
          updatedAt: team.updated_at,
        })) || [];

      const transformedPrivateTeams: Team[] =
        privateTeamsData?.map((team) => ({
          id: team.id,
          name: team.name,
          members: team.members || [],
          notes: team.notes || "",
          subjects: team.subjects || [],
          isPrivate: true,
          owner: team.owner,
          createdAt: team.created_at,
          updatedAt: team.updated_at,
        })) || [];

      const transformedStudents: User[] =
        studentsData?.map((student) => ({
          id: student.id,
          displayName: student.display_name,
          role: student.role,
          classCode: student.class_code,
        })) || [];

      setPublicTeams(transformedPublicTeams);
      setPrivateTeams(transformedPrivateTeams);
      setStudents(
        transformedStudents.length > 0 ? transformedStudents : demoStudents,
      );

      // Set up realtime subscription for teams changes
      const subscription = supabase
        .channel("teams_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "teams" },
          () => {
            // Refresh teams when changes occur
            fetchData();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    } catch (err) {
      console.error("Error fetching data:", err);
      // Fallback to demo data
      setPublicTeams(demoTeams);
      setPrivateTeams(demoPrivateTeams);
      setStudents(demoStudents);
      setAvailableSubjects(defaultSubjects);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPublicTeam = async () => {
    if (
      !newTeam.name ||
      !user ||
      !hasPermission(["Leader", "Co-Leader", "Admin"])
    )
      return;

    try {
      // Add team to Supabase
      const { data, error } = await supabase
        .from("teams")
        .insert([
          {
            name: newTeam.name,
            members: newTeam.members || [],
            notes: newTeam.notes || "",
            subjects: newTeam.subjects || [],
            is_private: false,
            owner: user.id,
          },
        ])
        .select();

      if (error) throw error;

      // Add to local state
      if (data && data[0]) {
        const newPublicTeam: Team = {
          id: data[0].id,
          name: data[0].name,
          members: data[0].members || [],
          notes: data[0].notes || "",
          subjects: data[0].subjects || [],
          isPrivate: false,
          owner: data[0].owner,
          createdAt: data[0].created_at,
          updatedAt: data[0].updated_at,
        };

        setPublicTeams([...publicTeams, newPublicTeam]);
        setSelectedTeam(newPublicTeam);
      }

      // Reset form
      setNewTeam({
        name: "",
        members: [],
        notes: "",
        subjects: [],
      });
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error("Error adding public team:", err);
    }
  };

  const handleAddPrivateTeam = async () => {
    if (!newPrivateTeam.name || !user) return;

    try {
      // Make sure creator is always included in members
      const members = [...(newPrivateTeam.members || [])];
      if (!members.includes(user.id)) {
        members.push(user.id);
      }

      // Add private team to Supabase
      const { data, error } = await supabase
        .from("teams")
        .insert([
          {
            name: newPrivateTeam.name,
            members: members,
            notes: newPrivateTeam.notes || "",
            subjects: newPrivateTeam.subjects || [],
            is_private: true,
            owner: user.id,
          },
        ])
        .select();

      if (error) throw error;

      // Add to local state
      if (data && data[0]) {
        const newTeam: Team = {
          id: data[0].id,
          name: data[0].name,
          members: data[0].members || [],
          notes: data[0].notes || "",
          subjects: data[0].subjects || [],
          isPrivate: true,
          owner: data[0].owner,
          createdAt: data[0].created_at,
          updatedAt: data[0].updated_at,
        };

        setPrivateTeams([...privateTeams, newTeam]);
        setSelectedPrivateTeam(newTeam);
      }

      // Reset form
      setNewPrivateTeam({
        name: "",
        members: [],
        notes: "",
        subjects: [],
        isPrivate: true,
        owner: user.id,
      });
      setIsAddPrivateDialogOpen(false);
    } catch (err) {
      console.error("Error adding private team:", err);
    }
  };

  const handleEditPublicTeam = async () => {
    if (!editingTeam || !hasPermission(["Leader", "Co-Leader", "Admin"]))
      return;

    try {
      // Update team in Supabase
      const { error } = await supabase
        .from("teams")
        .update({
          name: editingTeam.name,
          members: editingTeam.members,
          notes: editingTeam.notes,
          subjects: editingTeam.subjects,
        })
        .eq("id", editingTeam.id);

      if (error) throw error;

      // Update local state
      setPublicTeams(
        publicTeams.map((team) =>
          team.id === editingTeam.id ? editingTeam : team,
        ),
      );
      setSelectedTeam(editingTeam);
      setEditingTeam(null);
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating public team:", err);
    }
  };

  const handleEditPrivateTeam = async () => {
    if (!editingPrivateTeam || !user) return;

    // Check if user is owner or member
    const isOwner = editingPrivateTeam.owner === user.id;
    const isMember = editingPrivateTeam.members.includes(user.id);

    if (!isOwner && !isMember) return;

    try {
      // Prepare update data based on permissions
      const updateData: any = {};

      // Owner can update everything
      if (isOwner) {
        updateData.name = editingPrivateTeam.name;
        updateData.members = editingPrivateTeam.members;
        updateData.notes = editingPrivateTeam.notes;
        updateData.subjects = editingPrivateTeam.subjects;
      }
      // Members can only update name and notes
      else if (isMember) {
        updateData.name = editingPrivateTeam.name;
        updateData.notes = editingPrivateTeam.notes;
      }

      // Update team in Supabase
      const { error } = await supabase
        .from("teams")
        .update(updateData)
        .eq("id", editingPrivateTeam.id);

      if (error) throw error;

      // Update local state
      setPrivateTeams(
        privateTeams.map((team) =>
          team.id === editingPrivateTeam.id ? editingPrivateTeam : team,
        ),
      );
      setSelectedPrivateTeam(editingPrivateTeam);
      setEditingPrivateTeam(null);
      setIsEditPrivateDialogOpen(false);
    } catch (err) {
      console.error("Error updating private team:", err);
    }
  };

  const handleDeletePublicTeam = async (id: string) => {
    if (!hasPermission(["Leader", "Co-Leader", "Admin"])) return;

    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      // Delete team from Supabase
      const { error } = await supabase.from("teams").delete().eq("id", id);

      if (error) throw error;

      // Update local state
      setPublicTeams(publicTeams.filter((team) => team.id !== id));
      if (selectedTeam?.id === id) {
        setSelectedTeam(null);
      }
    } catch (err) {
      console.error("Error deleting public team:", err);
    }
  };

  const handleDeletePrivateTeam = async (id: string) => {
    if (!user) return;

    const team = privateTeams.find((t) => t.id === id);
    if (!team) return;

    // Only owner can delete private team
    if (team.owner !== user.id) return;

    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      // Delete team from Supabase
      const { error } = await supabase.from("teams").delete().eq("id", id);

      if (error) throw error;

      // Update local state
      setPrivateTeams(privateTeams.filter((team) => team.id !== id));
      if (selectedPrivateTeam?.id === id) {
        setSelectedPrivateTeam(null);
      }
    } catch (err) {
      console.error("Error deleting private team:", err);
    }
  };

  const handleLeavePrivateTeam = async (teamId: string) => {
    if (!user) return;

    const team = privateTeams.find((t) => t.id === teamId);
    if (!team) return;

    // Owner cannot leave, only delete
    if (team.owner === user.id) return;

    if (!confirm("Are you sure you want to leave this team?")) return;

    // Remove user from members
    const updatedMembers = team.members.filter((id) => id !== user.id);

    try {
      // Update team in Supabase
      const { error } = await supabase
        .from("teams")
        .update({ members: updatedMembers })
        .eq("id", teamId);

      if (error) throw error;

      // Update local state
      setPrivateTeams(privateTeams.filter((team) => team.id !== teamId));
      if (selectedPrivateTeam?.id === teamId) {
        setSelectedPrivateTeam(null);
      }
    } catch (err) {
      console.error("Error leaving private team:", err);
    }
  };

  const handleToggleStudentInPublicTeam = async (
    teamId: string,
    studentId: string,
  ) => {
    if (!hasPermission(["Leader", "Co-Leader", "Admin"])) return;

    const team = publicTeams.find((t) => t.id === teamId);
    if (!team) return;

    const updatedMembers = team.members.includes(studentId)
      ? team.members.filter((id) => id !== studentId)
      : [...team.members, studentId];

    try {
      // Update in Supabase
      const { error } = await supabase
        .from("teams")
        .update({ members: updatedMembers })
        .eq("id", teamId);

      if (error) throw error;

      // Update local state
      const updatedTeam = { ...team, members: updatedMembers };
      setPublicTeams(
        publicTeams.map((t) => (t.id === teamId ? updatedTeam : t)),
      );
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(updatedTeam);
      }
    } catch (err) {
      console.error("Error updating team members:", err);
    }
  };

  const handleToggleStudentInPrivateTeam = async (
    teamId: string,
    studentId: string,
  ) => {
    if (!user) return;

    const team = privateTeams.find((t) => t.id === teamId);
    if (!team) return;

    // Only owner can modify members
    if (team.owner !== user.id) return;

    const updatedMembers = team.members.includes(studentId)
      ? team.members.filter((id) => id !== studentId)
      : [...team.members, studentId];

    try {
      // Update in Supabase
      const { error } = await supabase
        .from("teams")
        .update({ members: updatedMembers })
        .eq("id", teamId);

      if (error) throw error;

      // Update local state
      const updatedTeam = { ...team, members: updatedMembers };
      setPrivateTeams(
        privateTeams.map((t) => (t.id === teamId ? updatedTeam : t)),
      );
      if (selectedPrivateTeam?.id === teamId) {
        setSelectedPrivateTeam(updatedTeam);
      }
    } catch (err) {
      console.error("Error updating private team members:", err);
    }
  };

  const getStudentById = (id: string) => {
    return students.find((student) => student.id === id);
  };

  const toggleMember = (studentId: string, isPrivate: boolean = false) => {
    if (isPrivate) {
      if (newPrivateTeam.members?.includes(studentId)) {
        setNewPrivateTeam({
          ...newPrivateTeam,
          members: newPrivateTeam.members.filter((id) => id !== studentId),
        });
      } else {
        setNewPrivateTeam({
          ...newPrivateTeam,
          members: [...(newPrivateTeam.members || []), studentId],
        });
      }
    } else {
      if (newTeam.members?.includes(studentId)) {
        setNewTeam({
          ...newTeam,
          members: newTeam.members.filter((id) => id !== studentId),
        });
      } else {
        setNewTeam({
          ...newTeam,
          members: [...(newTeam.members || []), studentId],
        });
      }
    }
  };

  const toggleEditMember = (studentId: string, isPrivate: boolean = false) => {
    if (isPrivate) {
      if (!editingPrivateTeam) return;

      if (editingPrivateTeam.members.includes(studentId)) {
        setEditingPrivateTeam({
          ...editingPrivateTeam,
          members: editingPrivateTeam.members.filter((id) => id !== studentId),
        });
      } else {
        setEditingPrivateTeam({
          ...editingPrivateTeam,
          members: [...editingPrivateTeam.members, studentId],
        });
      }
    } else {
      if (!editingTeam) return;

      if (editingTeam.members.includes(studentId)) {
        setEditingTeam({
          ...editingTeam,
          members: editingTeam.members.filter((id) => id !== studentId),
        });
      } else {
        setEditingTeam({
          ...editingTeam,
          members: [...editingTeam.members, studentId],
        });
      }
    }
  };

  const toggleSubject = (subject: string, isPrivate: boolean = false) => {
    if (isPrivate) {
      if (newPrivateTeam.subjects?.includes(subject)) {
        setNewPrivateTeam({
          ...newPrivateTeam,
          subjects: newPrivateTeam.subjects.filter((s) => s !== subject),
        });
      } else {
        setNewPrivateTeam({
          ...newPrivateTeam,
          subjects: [...(newPrivateTeam.subjects || []), subject],
        });
      }
    } else {
      if (newTeam.subjects?.includes(subject)) {
        setNewTeam({
          ...newTeam,
          subjects: newTeam.subjects.filter((s) => s !== subject),
        });
      } else {
        setNewTeam({
          ...newTeam,
          subjects: [...(newTeam.subjects || []), subject],
        });
      }
    }
  };

  const toggleEditSubject = (subject: string, isPrivate: boolean = false) => {
    if (isPrivate) {
      if (!editingPrivateTeam) return;

      if (editingPrivateTeam.subjects?.includes(subject)) {
        setEditingPrivateTeam({
          ...editingPrivateTeam,
          subjects: editingPrivateTeam.subjects.filter((s) => s !== subject),
        });
      } else {
        setEditingPrivateTeam({
          ...editingPrivateTeam,
          subjects: [...(editingPrivateTeam.subjects || []), subject],
        });
      }
    } else {
      if (!editingTeam) return;

      if (editingTeam.subjects?.includes(subject)) {
        setEditingTeam({
          ...editingTeam,
          subjects: editingTeam.subjects.filter((s) => s !== subject),
        });
      } else {
        setEditingTeam({
          ...editingTeam,
          subjects: [...(editingTeam.subjects || []), subject],
        });
      }
    }
  };

  const startEditPublicTeam = (team: Team) => {
    if (!hasPermission(["Leader", "Co-Leader", "Admin"])) return;
    setEditingTeam({ ...team });
    setIsEditDialogOpen(true);
  };

  const startEditPrivateTeam = (team: Team) => {
    if (!user) return;

    // Check if user is owner or member
    const isOwner = team.owner === user.id;
    const isMember = team.members.includes(user.id);

    if (!isOwner && !isMember) return;

    setEditingPrivateTeam({ ...team });
    setIsEditPrivateDialogOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout activeTab="teams">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="teams">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
            <p className="text-muted-foreground">
              View and manage class teams and their members.
            </p>
          </div>

          <div className="flex space-x-2">
            {/* Public Team Button - Only for Leaders/Co-Leaders/Admin */}
            {hasPermission(["Leader", "Co-Leader", "Admin"]) && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Public Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Create New Public Team</DialogTitle>
                    <DialogDescription>
                      Create a team visible to all class members.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="teamName">Team Name</Label>
                        <Input
                          id="teamName"
                          placeholder="Team Name"
                          value={newTeam.name}
                          onChange={(e) =>
                            setNewTeam({ ...newTeam, name: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="teamNotes">Notes (Optional)</Label>
                        <Textarea
                          id="teamNotes"
                          placeholder="Team description or notes"
                          value={newTeam.notes}
                          onChange={(e) =>
                            setNewTeam({ ...newTeam, notes: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Related Subjects</Label>
                        <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto">
                          {availableSubjects.map((subject) => (
                            <div
                              key={subject}
                              className="flex items-center space-x-2 mb-2"
                            >
                              <Checkbox
                                id={`subject-${subject}`}
                                checked={
                                  newTeam.subjects?.includes(subject) || false
                                }
                                onCheckedChange={() => toggleSubject(subject)}
                              />
                              <Label
                                htmlFor={`subject-${subject}`}
                                className="text-sm cursor-pointer"
                              >
                                {subject}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Team Members</Label>
                      <div className="border rounded-md p-3 max-h-[300px] overflow-y-auto">
                        {students.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md"
                          >
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={
                                newTeam.members?.includes(student.id) || false
                              }
                              onCheckedChange={() => toggleMember(student.id)}
                            />
                            <Label
                              htmlFor={`student-${student.id}`}
                              className="flex items-center cursor-pointer flex-1"
                            >
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.displayName}`}
                                />
                                <AvatarFallback>
                                  {student.displayName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {student.displayName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {student.role}
                                </div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
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
                      onClick={handleAddPublicTeam}
                      disabled={!newTeam.name}
                    >
                      Create Team
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Private Team Button - For all users */}
            <Dialog
              open={isAddPrivateDialogOpen}
              onOpenChange={setIsAddPrivateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Private Team
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create New Private Team</DialogTitle>
                  <DialogDescription>
                    Create a team visible only to its members.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="privateTeamName">Team Name</Label>
                      <Input
                        id="privateTeamName"
                        placeholder="Team Name"
                        value={newPrivateTeam.name}
                        onChange={(e) =>
                          setNewPrivateTeam({
                            ...newPrivateTeam,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="privateTeamNotes">Notes (Optional)</Label>
                      <Textarea
                        id="privateTeamNotes"
                        placeholder="Team description or notes"
                        value={newPrivateTeam.notes}
                        onChange={(e) =>
                          setNewPrivateTeam({
                            ...newPrivateTeam,
                            notes: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Related Subjects</Label>
                      <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto">
                        {availableSubjects.map((subject) => (
                          <div
                            key={subject}
                            className="flex items-center space-x-2 mb-2"
                          >
                            <Checkbox
                              id={`private-subject-${subject}`}
                              checked={
                                newPrivateTeam.subjects?.includes(subject) ||
                                false
                              }
                              onCheckedChange={() =>
                                toggleSubject(subject, true)
                              }
                            />
                            <Label
                              htmlFor={`private-subject-${subject}`}
                              className="text-sm cursor-pointer"
                            >
                              {subject}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Team Members</Label>
                    <div className="border rounded-md p-3 max-h-[300px] overflow-y-auto">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md"
                        >
                          <Checkbox
                            id={`private-student-${student.id}`}
                            checked={
                              newPrivateTeam.members?.includes(student.id) ||
                              false
                            }
                            onCheckedChange={() =>
                              toggleMember(student.id, true)
                            }
                          />
                          <Label
                            htmlFor={`private-student-${student.id}`}
                            className="flex items-center cursor-pointer flex-1"
                          >
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.displayName}`}
                              />
                              <AvatarFallback>
                                {student.displayName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {student.displayName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {student.role}
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddPrivateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddPrivateTeam}
                    disabled={!newPrivateTeam.name}
                  >
                    Create Team
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs
          defaultValue="public"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="public" className="flex items-center">
              <Users className="mr-2 h-4 w-4" /> Public Teams
            </TabsTrigger>
            <TabsTrigger value="private" className="flex items-center">
              <Users className="mr-2 h-4 w-4" /> Private Teams
            </TabsTrigger>
          </TabsList>

          {/* Public Teams Tab */}
          <TabsContent value="public" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <div className="font-medium text-lg flex items-center">
                  <Users className="mr-2 h-5 w-5" /> Public Teams
                </div>
                {publicTeams.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      No public teams created yet
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {publicTeams.map((team) => (
                      <Card
                        key={team.id}
                        className={`cursor-pointer hover:border-primary transition-colors ${selectedTeam?.id === team.id ? "border-primary" : ""}`}
                        onClick={() => setSelectedTeam(team)}
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">
                              {team.name}
                            </CardTitle>
                            {hasPermission([
                              "Leader",
                              "Co-Leader",
                              "Admin",
                            ]) && (
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditPublicTeam(team);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePublicTeam(team.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="h-4 w-4 mr-1" />
                            {team.members.length} members
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {team.subjects?.length || 0} subjects
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                {selectedTeam ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedTeam.name}</CardTitle>
                      {selectedTeam.notes && (
                        <CardDescription>{selectedTeam.notes}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2 flex items-center">
                          <Users className="h-5 w-5 mr-2" /> Team Members
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedTeam.members.length === 0 ? (
                            <div className="col-span-full text-muted-foreground text-center py-4">
                              No members in this team
                            </div>
                          ) : (
                            selectedTeam.members.map((memberId) => {
                              const memberData = getStudentById(memberId);
                              if (!memberData) return null;

                              return (
                                <div
                                  key={memberId}
                                  className="flex items-center p-2 border rounded-md"
                                >
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage
                                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${memberData.displayName}`}
                                    />
                                    <AvatarFallback>
                                      {memberData.displayName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">
                                      {memberData.displayName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {memberData.role}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2 flex items-center">
                          <BookOpen className="h-5 w-5 mr-2" /> Assigned
                          Subjects
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {!selectedTeam.subjects ||
                          selectedTeam.subjects.length === 0 ? (
                            <div className="w-full text-muted-foreground text-center py-4">
                              No subjects assigned to this team
                            </div>
                          ) : (
                            selectedTeam.subjects.map((subject) => (
                              <Badge key={subject} variant="outline">
                                {subject}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full mr-2"
                            disabled={
                              !hasPermission(["Leader", "Co-Leader", "Admin"])
                            }
                          >
                            <UserPlus className="mr-2 h-4 w-4" />{" "}
                            {hasPermission(["Leader", "Co-Leader", "Admin"])
                              ? "Manage Members"
                              : "View Members"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {hasPermission(["Leader", "Co-Leader", "Admin"])
                                ? "Manage"
                                : "View"}{" "}
                              Team Members
                            </DialogTitle>
                            <DialogDescription>
                              {hasPermission(["Leader", "Co-Leader", "Admin"])
                                ? "Add or remove students from"
                                : "Members in"}{" "}
                              {selectedTeam.name}.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="max-h-[300px] overflow-y-auto space-y-2 py-4">
                            {students.map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center justify-between p-2 hover:bg-muted rounded-md"
                              >
                                <div className="flex items-center space-x-2">
                                  {hasPermission([
                                    "Leader",
                                    "Co-Leader",
                                    "Admin",
                                  ]) ? (
                                    <input
                                      type="checkbox"
                                      id={`team-${selectedTeam.id}-student-${student.id}`}
                                      checked={selectedTeam.members.includes(
                                        student.id,
                                      )}
                                      onChange={() =>
                                        handleToggleStudentInPublicTeam(
                                          selectedTeam.id,
                                          student.id,
                                        )
                                      }
                                      className="h-4 w-4"
                                    />
                                  ) : (
                                    <div className="w-4 h-4 flex items-center justify-center">
                                      {selectedTeam.members.includes(
                                        student.id,
                                      ) && (
                                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                                      )}
                                    </div>
                                  )}
                                  <Label
                                    htmlFor={
                                      hasPermission([
                                        "Leader",
                                        "Co-Leader",
                                        "Admin",
                                      ])
                                        ? `team-${selectedTeam.id}-student-${student.id}`
                                        : undefined
                                    }
                                    className="flex items-center space-x-2 cursor-pointer"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.displayName}`}
                                      />
                                      <AvatarFallback>
                                        {student.displayName.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{student.displayName}</span>
                                  </Label>
                                </div>
                                <Badge variant="outline">{student.role}</Badge>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Join Team Chat Button - Only for team members */}
                      {user && selectedTeam.members.includes(user.id) && (
                        <Button
                          variant="default"
                          className="w-full ml-2"
                          onClick={() => {
                            // Navigate to team-specific chat
                            window.location.href = `/team-chat/${selectedTeam.id}`;
                          }}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" /> Team Chat
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium mb-2">
                        Select a team to view details
                      </h3>
                      <p className="mb-4">
                        Click on a team from the list to view its members and
                        subjects
                      </p>
                      {hasPermission(["Leader", "Co-Leader", "Admin"]) &&
                        publicTeams.length === 0 && (
                          <Button onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Create Public Team
                          </Button>
                        )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Private Teams Tab */}
          <TabsContent value="private" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <div className="font-medium text-lg flex items-center">
                  <Users className="mr-2 h-5 w-5" /> My Private Teams
                </div>
                {privateTeams.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      No private teams created yet
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {privateTeams.map((team) => (
                      <Card
                        key={team.id}
                        className={`cursor-pointer hover:border-primary transition-colors ${selectedPrivateTeam?.id === team.id ? "border-primary" : ""}`}
                        onClick={() => setSelectedPrivateTeam(team)}
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">
                              {team.name}
                            </CardTitle>
                            {user &&
                              (team.owner === user.id ||
                                team.members.includes(user.id)) && (
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditPrivateTeam(team);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {team.owner === user.id && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePrivateTeam(team.id);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="h-4 w-4 mr-1" />
                            {team.members.length} members
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {team.subjects?.length || 0} subjects
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                {selectedPrivateTeam ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedPrivateTeam.name}</CardTitle>
                      {selectedPrivateTeam.notes && (
                        <CardDescription>
                          {selectedPrivateTeam.notes}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2 flex items-center">
                          <Users className="h-5 w-5 mr-2" /> Team Members
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedPrivateTeam.members.length === 0 ? (
                            <div className="col-span-full text-muted-foreground text-center py-4">
                              No members in this team
                            </div>
                          ) : (
                            selectedPrivateTeam.members.map((memberId) => {
                              const memberData = getStudentById(memberId);
                              if (!memberData) return null;

                              return (
                                <div
                                  key={memberId}
                                  className="flex items-center p-2 border rounded-md"
                                >
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage
                                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${memberData.displayName}`}
                                    />
                                    <AvatarFallback>
                                      {memberData.displayName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">
                                      {memberData.displayName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {memberData.role}
                                    </div>
                                  </div>
                                  {memberId === selectedPrivateTeam.owner && (
                                    <Badge className="ml-2" variant="secondary">
                                      Owner
                                    </Badge>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2 flex items-center">
                          <BookOpen className="h-5 w-5 mr-2" /> Assigned
                          Subjects
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {!selectedPrivateTeam.subjects ||
                          selectedPrivateTeam.subjects.length === 0 ? (
                            <div className="w-full text-muted-foreground text-center py-4">
                              No subjects assigned to this team
                            </div>
                          ) : (
                            selectedPrivateTeam.subjects.map((subject) => (
                              <Badge key={subject} variant="outline">
                                {subject}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      {user && selectedPrivateTeam.owner === user.id && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full mr-2">
                              <UserPlus className="mr-2 h-4 w-4" /> Manage
                              Members
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Team Members</DialogTitle>
                              <DialogDescription>
                                Add or remove students from{" "}
                                {selectedPrivateTeam.name}.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="max-h-[300px] overflow-y-auto space-y-2 py-4">
                              {students.map((student) => (
                                <div
                                  key={student.id}
                                  className="flex items-center justify-between p-2 hover:bg-muted rounded-md"
                                >
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`private-team-${selectedPrivateTeam.id}-student-${student.id}`}
                                      checked={selectedPrivateTeam.members.includes(
                                        student.id,
                                      )}
                                      onChange={() =>
                                        handleToggleStudentInPrivateTeam(
                                          selectedPrivateTeam.id,
                                          student.id,
                                        )
                                      }
                                      className="h-4 w-4"
                                    />
                                    <Label
                                      htmlFor={`private-team-${selectedPrivateTeam.id}-student-${student.id}`}
                                      className="flex items-center space-x-2 cursor-pointer"
                                    >
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage
                                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.displayName}`}
                                        />
                                        <AvatarFallback>
                                          {student.displayName.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span>{student.displayName}</span>
                                    </Label>
                                  </div>
                                  <Badge variant="outline">
                                    {student.role}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      <div className="flex w-full">
                        {/* Team Chat Button */}
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => {
                            // Navigate to team-specific chat
                            window.location.href = `/team-chat/${selectedPrivateTeam.id}`;
                          }}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" /> Team Chat
                        </Button>

                        {/* Leave Team Button - Only for members who are not owners */}
                        {user &&
                          selectedPrivateTeam.members.includes(user.id) &&
                          selectedPrivateTeam.owner !== user.id && (
                            <Button
                              variant="destructive"
                              className="ml-2"
                              onClick={() =>
                                handleLeavePrivateTeam(selectedPrivateTeam.id)
                              }
                            >
                              <LogOut className="mr-2 h-4 w-4" /> Leave
                            </Button>
                          )}
                      </div>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium mb-2">
                        Select a team to view details
                      </h3>
                      <p className="mb-4">
                        Click on a team from the list to view its members and
                        subjects
                      </p>
                      {privateTeams.length === 0 && (
                        <Button onClick={() => setIsAddPrivateDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" /> Create Private Team
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Public Team Dialog */}
        {editingTeam && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Edit Public Team</DialogTitle>
                <DialogDescription>
                  Update team information and subject assignments.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-teamName">Team Name</Label>
                    <Input
                      id="edit-teamName"
                      value={editingTeam.name}
                      onChange={(e) =>
                        setEditingTeam({ ...editingTeam, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-teamNotes">Notes (Optional)</Label>
                    <Textarea
                      id="edit-teamNotes"
                      value={editingTeam.notes}
                      onChange={(e) =>
                        setEditingTeam({
                          ...editingTeam,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Related Subjects</Label>
                    <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto">
                      {availableSubjects.map((subject) => (
                        <div
                          key={subject}
                          className="flex items-center space-x-2 mb-2"
                        >
                          <Checkbox
                            id={`edit-subject-${subject}`}
                            checked={
                              editingTeam.subjects?.includes(subject) || false
                            }
                            onCheckedChange={() => toggleEditSubject(subject)}
                          />
                          <Label
                            htmlFor={`edit-subject-${subject}`}
                            className="text-sm cursor-pointer"
                          >
                            {subject}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Team Members</Label>
                  <div className="border rounded-md p-3 max-h-[300px] overflow-y-auto">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md"
                      >
                        <Checkbox
                          id={`edit-student-${student.id}`}
                          checked={
                            editingTeam.members?.includes(student.id) || false
                          }
                          onCheckedChange={() => toggleEditMember(student.id)}
                        />
                        <Label
                          htmlFor={`edit-student-${student.id}`}
                          className="flex items-center cursor-pointer flex-1"
                        >
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.displayName}`}
                            />
                            <AvatarFallback>
                              {student.displayName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {student.displayName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {student.role}
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditPublicTeam}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Private Team Dialog */}
        {editingPrivateTeam && (
          <Dialog
            open={isEditPrivateDialogOpen}
            onOpenChange={setIsEditPrivateDialogOpen}
          >
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Edit Private Team</DialogTitle>
                <DialogDescription>
                  Update team information and subject assignments.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-privateTeamName">Team Name</Label>
                    <Input
                      id="edit-privateTeamName"
                      value={editingPrivateTeam.name}
                      onChange={(e) =>
                        setEditingPrivateTeam({
                          ...editingPrivateTeam,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-privateTeamNotes">
                      Notes (Optional)
                    </Label>
                    <Textarea
                      id="edit-privateTeamNotes"
                      value={editingPrivateTeam.notes}
                      onChange={(e) =>
                        setEditingPrivateTeam({
                          ...editingPrivateTeam,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>

                  {user && editingPrivateTeam.owner === user.id && (
                    <div className="space-y-2">
                      <Label>Related Subjects</Label>
                      <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto">
                        {availableSubjects.map((subject) => (
                          <div
                            key={subject}
                            className="flex items-center space-x-2 mb-2"
                          >
                            <Checkbox
                              id={`edit-private-subject-${subject}`}
                              checked={
                                editingPrivateTeam.subjects?.includes(
                                  subject,
                                ) || false
                              }
                              onCheckedChange={() =>
                                toggleEditSubject(subject, true)
                              }
                            />
                            <Label
                              htmlFor={`edit-private-subject-${subject}`}
                              className="text-sm cursor-pointer"
                            >
                              {subject}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {user && editingPrivateTeam.owner === user.id && (
                  <div className="space-y-4">
                    <Label>Team Members</Label>
                    <div className="border rounded-md p-3 max-h-[300px] overflow-y-auto">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md"
                        >
                          <Checkbox
                            id={`edit-private-student-${student.id}`}
                            checked={
                              editingPrivateTeam.members?.includes(
                                student.id,
                              ) || false
                            }
                            onCheckedChange={() =>
                              toggleEditMember(student.id, true)
                            }
                          />
                          <Label
                            htmlFor={`edit-private-student-${student.id}`}
                            className="flex items-center cursor-pointer flex-1"
                          >
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.displayName}`}
                              />
                              <AvatarFallback>
                                {student.displayName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {student.displayName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {student.role}
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditPrivateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditPrivateTeam}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}

// Default subjects if none are found in the database
const defaultSubjects = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Geography",
  "Art",
  "Music",
  "PE",
  "Computing",
  "French",
];

// Demo data for fallback when Supabase connection fails
const demoStudents: User[] = [
  {
    id: "1",
    displayName: "Triet",
    role: "Student",
    classCode: "JD42",
  },
  {
    id: "2",
    displayName: "Thy",
    role: "Leader",
    classCode: "JS85",
  },
  {
    id: "3",
    displayName: "Duy",
    role: "Admin",
    classCode: "TA01",
  },
];

const demoTeams: Team[] = [
  {
    id: "1",
    name: "Science Team",
    members: ["1", "2", "3"],
    notes: "Focus on science projects and experiments",
    subjects: ["Science", "Computing"],
  },
  {
    id: "2",
    name: "Math Group",
    members: ["1", "2"],
    notes: "Advanced mathematics study group",
    subjects: ["Mathematics"],
  },
  {
    id: "3",
    name: "Language Arts",
    members: ["2", "3"],
    notes: "English and literature focus",
    subjects: ["English", "French"],
  },
];

const demoPrivateTeams: Team[] = [
  {
    id: "4",
    name: "Study Group A",
    members: ["1", "2"],
    notes: "Private study group for exams",
    subjects: ["Mathematics", "Science"],
    isPrivate: true,
    owner: "1",
  },
  {
    id: "5",
    name: "Project Team B",
    members: ["1", "3"],
    notes: "Working on the final project",
    subjects: ["Computing"],
    isPrivate: true,
    owner: "3",
  },
];

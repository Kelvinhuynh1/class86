import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User, UserRole, Team } from "@/types";
import { supabase } from "@/lib/supabase";
import {
  Lock,
  UserPlus,
  RefreshCw,
  Edit,
  Trash2,
  Users,
  ShieldAlert,
  CheckCircle,
} from "lucide-react";

export default function AdminPanelPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [students, setStudents] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("students");
  const navigate = useNavigate();

  // For adding/editing students
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [isEditStudentDialogOpen, setIsEditStudentDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<User>>({
    displayName: "",
    role: "Student",
    classCode: "",
    password: "",
  });
  const [editingStudent, setEditingStudent] = useState<User | null>(null);

  // For adding/editing teams
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false);
  const [newTeam, setNewTeam] = useState<Partial<Team>>({
    name: "",
    members: [],
    notes: "",
    subjects: [],
  });
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([
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
  ]);

  useEffect(() => {
    // Check if admin is already authenticated in session storage
    const adminAuth = sessionStorage.getItem("adminAuth");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch students from Supabase
      const { data: studentsData, error: studentsError } = await supabase
        .from("users")
        .select("*");

      if (studentsError) throw studentsError;

      // Fetch teams from Supabase
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*");

      if (teamsError) throw teamsError;

      // Transform data to match our expected format
      const transformedStudents =
        studentsData?.map((student) => ({
          id: student.id,
          displayName: student.display_name,
          role: student.role,
          classCode: student.class_code,
          password: student.password,
        })) || [];

      const transformedTeams =
        teamsData?.map((team) => ({
          id: team.id,
          name: team.name,
          members: team.members || [],
          notes: team.notes || "",
          subjects: team.subjects || [],
        })) || [];

      if (transformedStudents.length > 0) {
        setStudents(transformedStudents);
      } else {
        // Fallback to demo data if no data in Supabase
        setStudents(demoStudents);
      }

      if (transformedTeams.length > 0) {
        setTeams(transformedTeams);
      } else {
        // Fallback to demo data if no data in Supabase
        setTeams(demoTeams);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Fallback to demo data if Supabase connection fails
      setStudents(demoStudents);
      setTeams(demoTeams);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = () => {
    // Check if password matches the hardcoded admin password
    if (password === "2805200820112011") {
      setIsAuthenticated(true);
      sessionStorage.setItem("adminAuth", "true");
      fetchData();
    } else {
      setError("Invalid password");
    }
  };

  const generateClassCode = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    let code = "";

    // Generate 2 random letters
    for (let i = 0; i < 2; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // Generate 2 random numbers
    for (let i = 0; i < 2; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return code;
  };

  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "&@#$%";
    let password = "";

    // 2 uppercase
    for (let i = 0; i < 2; i++) {
      password += uppercase.charAt(
        Math.floor(Math.random() * uppercase.length),
      );
    }

    // 2 lowercase
    for (let i = 0; i < 2; i++) {
      password += lowercase.charAt(
        Math.floor(Math.random() * lowercase.length),
      );
    }

    // 2 numbers
    for (let i = 0; i < 2; i++) {
      password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    // 1 symbol
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));

    // Shuffle the password
    return password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
  };

  // Student Management Functions
  const handleAddStudent = async () => {
    if (!newStudent.displayName) return;

    const classCode = newStudent.classCode || generateClassCode();
    const password = newStudent.password || generatePassword();
    const email = `${classCode.toLowerCase()}@example.com`; // Generate email from class code

    try {
      // Direct insert to public.users
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            display_name: newStudent.displayName,
            role: newStudent.role || "Student",
            class_code: classCode,
            password: password,
          },
        ])
        .select();

      if (error) {
        console.error("Error adding student:", error);
        alert("Failed to add student: " + error.message);
        return;
      }

      // If we got data back from the insert, use it
      if (data && data[0]) {
        const student: User = {
          id: data[0].id,
          displayName: data[0].display_name,
          role: data[0].role as UserRole,
          classCode: data[0].class_code,
          password: data[0].password,
        };

        // Update local state
        setStudents([...students, student]);
        setNewStudent({
          displayName: "",
          role: "Student",
          classCode: "",
          password: "",
        });
        setIsAddStudentDialogOpen(false);
      }
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Failed to add student. Please try again.");
    }
  };

  const handleEditStudent = async () => {
    if (!editingStudent) return;

    try {
      // Update student in Supabase
      const { error } = await supabase
        .from("users")
        .update({
          display_name: editingStudent.displayName,
          role: editingStudent.role,
          class_code: editingStudent.classCode,
          password: editingStudent.password,
        })
        .eq("id", editingStudent.id);

      if (error) throw error;

      // Update local state
      setStudents(
        students.map((student) =>
          student.id === editingStudent.id ? editingStudent : student,
        ),
      );
      setEditingStudent(null);
      setIsEditStudentDialogOpen(false);
    } catch (error) {
      console.error("Error updating student:", error);
      // Fallback: just update local state
      setStudents(
        students.map((student) =>
          student.id === editingStudent.id ? editingStudent : student,
        ),
      );
      setEditingStudent(null);
      setIsEditStudentDialogOpen(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      // Delete student from Supabase
      const { error } = await supabase.from("users").delete().eq("id", id);

      if (error) throw error;

      // Update local state
      setStudents(students.filter((student) => student.id !== id));
    } catch (error) {
      console.error("Error deleting student:", error);
      // Fallback: just update local state
      setStudents(students.filter((student) => student.id !== id));
    }
  };

  const startEditStudent = (student: User) => {
    setEditingStudent({ ...student });
    setIsEditStudentDialogOpen(true);
  };

  // Team Management Functions
  const handleAddTeam = async () => {
    if (!newTeam.name) return;

    const team: Team = {
      id: Date.now().toString(),
      name: newTeam.name,
      members: newTeam.members || [],
      notes: newTeam.notes || "",
      subjects: newTeam.subjects || [],
    };

    try {
      // Add team to Supabase
      const { data, error } = await supabase
        .from("teams")
        .insert([
          {
            name: team.name,
            members: team.members,
            notes: team.notes,
            subjects: team.subjects,
          },
        ])
        .select();

      if (error) throw error;

      // If we got data back from the insert, use the ID from Supabase
      if (data && data[0]) {
        team.id = data[0].id;
      }

      // Update local state
      setTeams([...teams, team]);
      setNewTeam({
        name: "",
        members: [],
        notes: "",
        subjects: [],
      });
      setIsAddTeamDialogOpen(false);
    } catch (error) {
      console.error("Error adding team:", error);
      // Fallback: just update local state
      setTeams([...teams, team]);
      setIsAddTeamDialogOpen(false);
    }
  };

  const handleEditTeam = async () => {
    if (!editingTeam) return;

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
      setTeams(
        teams.map((team) => (team.id === editingTeam.id ? editingTeam : team)),
      );
      setEditingTeam(null);
      setIsEditTeamDialogOpen(false);
    } catch (error) {
      console.error("Error updating team:", error);
      // Fallback: just update local state
      setTeams(
        teams.map((team) => (team.id === editingTeam.id ? editingTeam : team)),
      );
      setEditingTeam(null);
      setIsEditTeamDialogOpen(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      // Delete team from Supabase
      const { error } = await supabase.from("teams").delete().eq("id", id);

      if (error) throw error;

      // Update local state
      setTeams(teams.filter((team) => team.id !== id));
    } catch (error) {
      console.error("Error deleting team:", error);
      // Fallback: just update local state
      setTeams(teams.filter((team) => team.id !== id));
    }
  };

  const startEditTeam = (team: Team) => {
    setEditingTeam({ ...team });
    setIsEditTeamDialogOpen(true);
  };

  const handleToggleStudentInTeam = (teamId: string, studentId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    const updatedMembers = team.members.includes(studentId)
      ? team.members.filter((id) => id !== studentId)
      : [...team.members, studentId];

    const updatedTeam = { ...team, members: updatedMembers };
    setTeams(teams.map((t) => (t.id === teamId ? updatedTeam : t)));

    // Update in Supabase
    supabase
      .from("teams")
      .update({ members: updatedMembers })
      .eq("id", teamId)
      .then(({ error }) => {
        if (error) console.error("Error updating team members:", error);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Admin Panel</CardTitle>
            <CardDescription className="text-center">
              Enter the admin password to access the management panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAuthenticate()}
                />
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleAuthenticate}>
              Access Admin Panel
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout activeTab="adminpanel">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground">
              Comprehensive management tools for your class
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/calendar")}>
            Back to Dashboard
          </Button>
        </div>

        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Admin Access</AlertTitle>
          <AlertDescription>
            You have full administrative privileges. Changes made here will
            affect all users.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students">Student Management</TabsTrigger>
            <TabsTrigger value="teams">Team Management</TabsTrigger>
          </TabsList>

          {/* Student Management Tab */}
          <TabsContent value="students" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Student Accounts</h2>
              <Dialog
                open={isAddStudentDialogOpen}
                onOpenChange={setIsAddStudentDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>
                      Create a new student account with auto-generated
                      credentials.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        placeholder="Full Name"
                        value={newStudent.displayName}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            displayName: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={newStudent.role}
                        onValueChange={(value) =>
                          setNewStudent({
                            ...newStudent,
                            role: value as UserRole,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Leader">Leader</SelectItem>
                          <SelectItem value="Co-Leader">Co-Leader</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="classCode">Class Code</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="classCode"
                          placeholder="Auto-generated"
                          value={newStudent.classCode}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              classCode: e.target.value,
                            })
                          }
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setNewStudent({
                              ...newStudent,
                              classCode: generateClassCode(),
                            })
                          }
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="password"
                          placeholder="Auto-generated"
                          value={newStudent.password}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              password: e.target.value,
                            })
                          }
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setNewStudent({
                              ...newStudent,
                              password: generatePassword(),
                            })
                          }
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddStudentDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddStudent}
                      disabled={!newStudent.displayName}
                    >
                      Add Student
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Class Code</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.displayName}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              student.role === "Admin"
                                ? "bg-blue-100 text-blue-800"
                                : student.role === "Leader"
                                  ? "bg-green-100 text-green-800"
                                  : student.role === "Co-Leader"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {student.role}
                          </span>
                        </TableCell>
                        <TableCell>{student.classCode}</TableCell>
                        <TableCell>{student.password}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditStudent(student)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteStudent(student.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit Student Dialog */}
            {editingStudent && (
              <Dialog
                open={isEditStudentDialogOpen}
                onOpenChange={setIsEditStudentDialogOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Student</DialogTitle>
                    <DialogDescription>
                      Update student information and access credentials.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-displayName">Display Name</Label>
                      <Input
                        id="edit-displayName"
                        value={editingStudent.displayName}
                        onChange={(e) =>
                          setEditingStudent({
                            ...editingStudent,
                            displayName: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-role">Role</Label>
                      <Select
                        value={editingStudent.role}
                        onValueChange={(value) =>
                          setEditingStudent({
                            ...editingStudent,
                            role: value as UserRole,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Leader">Leader</SelectItem>
                          <SelectItem value="Co-Leader">Co-Leader</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-classCode">Class Code</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="edit-classCode"
                          value={editingStudent.classCode}
                          onChange={(e) =>
                            setEditingStudent({
                              ...editingStudent,
                              classCode: e.target.value,
                            })
                          }
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setEditingStudent({
                              ...editingStudent,
                              classCode: generateClassCode(),
                            })
                          }
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-password">Password</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="edit-password"
                          value={editingStudent.password}
                          onChange={(e) =>
                            setEditingStudent({
                              ...editingStudent,
                              password: e.target.value,
                            })
                          }
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setEditingStudent({
                              ...editingStudent,
                              password: generatePassword(),
                            })
                          }
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditStudentDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleEditStudent}>Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* Team Management Tab */}
          <TabsContent value="teams" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Team Management</h2>
              <Dialog
                open={isAddTeamDialogOpen}
                onOpenChange={setIsAddTeamDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Users className="mr-2 h-4 w-4" /> Create Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                    <DialogDescription>
                      Create a new team and assign students and subjects.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
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
                      <Input
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
                      <div className="grid grid-cols-2 gap-2">
                        {availableSubjects.map((subject) => (
                          <div
                            key={subject}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={`subject-${subject}`}
                              checked={
                                newTeam.subjects?.includes(subject) || false
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewTeam({
                                    ...newTeam,
                                    subjects: [
                                      ...(newTeam.subjects || []),
                                      subject,
                                    ],
                                  });
                                } else {
                                  setNewTeam({
                                    ...newTeam,
                                    subjects:
                                      newTeam.subjects?.filter(
                                        (s) => s !== subject,
                                      ) || [],
                                  });
                                }
                              }}
                              className="h-4 w-4"
                            />
                            <Label
                              htmlFor={`subject-${subject}`}
                              className="text-sm"
                            >
                              {subject}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddTeamDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddTeam} disabled={!newTeam.name}>
                      Create Team
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{team.name}</CardTitle>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditTeam(team)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteTeam(team.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {team.notes && (
                      <CardDescription>{team.notes}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pb-2">
                    {team.subjects && team.subjects.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">
                          Related Subjects:
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {team.subjects.map((subject) => (
                            <span
                              key={subject}
                              className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <h4 className="text-sm font-medium mb-2">Team Members:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`team-${team.id}-student-${student.id}`}
                              checked={team.members.includes(student.id)}
                              onChange={() =>
                                handleToggleStudentInTeam(team.id, student.id)
                              }
                              className="h-4 w-4"
                            />
                            <Label
                              htmlFor={`team-${team.id}-student-${student.id}`}
                              className="text-sm"
                            >
                              {student.displayName}
                            </Label>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              student.role === "Admin"
                                ? "bg-blue-100 text-blue-800"
                                : student.role === "Leader"
                                  ? "bg-green-100 text-green-800"
                                  : student.role === "Co-Leader"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {student.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="text-xs text-muted-foreground">
                      {team.members.length} members assigned
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Edit Team Dialog */}
            {editingTeam && (
              <Dialog
                open={isEditTeamDialogOpen}
                onOpenChange={setIsEditTeamDialogOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Team</DialogTitle>
                    <DialogDescription>
                      Update team information and subject assignments.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-teamName">Team Name</Label>
                      <Input
                        id="edit-teamName"
                        value={editingTeam.name}
                        onChange={(e) =>
                          setEditingTeam({
                            ...editingTeam,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-teamNotes">Notes (Optional)</Label>
                      <Input
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
                      <div className="grid grid-cols-2 gap-2">
                        {availableSubjects.map((subject) => (
                          <div
                            key={subject}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={`edit-subject-${subject}`}
                              checked={
                                editingTeam.subjects?.includes(subject) || false
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditingTeam({
                                    ...editingTeam,
                                    subjects: [
                                      ...(editingTeam.subjects || []),
                                      subject,
                                    ],
                                  });
                                } else {
                                  setEditingTeam({
                                    ...editingTeam,
                                    subjects:
                                      editingTeam.subjects?.filter(
                                        (s) => s !== subject,
                                      ) || [],
                                  });
                                }
                              }}
                              className="h-4 w-4"
                            />
                            <Label
                              htmlFor={`edit-subject-${subject}`}
                              className="text-sm"
                            >
                              {subject}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditTeamDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleEditTeam}>Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Demo data for fallback when Supabase connection fails
const demoStudents: User[] = [
  {
    id: "1",
    displayName: "John Doe",
    role: "Student",
    classCode: "JD42",
    password: "7Hj&9Kl2",
  },
  {
    id: "2",
    displayName: "Jane Smith",
    role: "Leader",
    classCode: "JS85",
    password: "3Mn&7Pq9",
  },
  {
    id: "3",
    displayName: "Alex Johnson",
    role: "Co-Leader",
    classCode: "AJ63",
    password: "5Rt&2Zx8",
  },
  {
    id: "4",
    displayName: "Teacher Admin",
    role: "Admin",
    classCode: "TA01",
    password: "9Yb&4Vn1",
  },
];

const demoTeams: Team[] = [
  {
    id: "1",
    name: "Science Team",
    members: ["1", "2"],
    notes: "Focus on science projects and experiments",
    subjects: ["Science", "Computing"],
  },
  {
    id: "2",
    name: "Math Group",
    members: ["3", "4"],
    notes: "Advanced mathematics study group",
    subjects: ["Mathematics"],
  },
  {
    id: "3",
    name: "Language Arts",
    members: ["1", "3"],
    notes: "English and literature focus",
    subjects: ["English", "French"],
  },
];

import { useState } from "react";
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
import { User, UserRole } from "@/types";
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react";

export default function StudentManagement() {
  const [students, setStudents] = useState<User[]>([
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
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<User>>({
    displayName: "",
    role: "Student",
    classCode: "",
    password: "",
  });
  const [editingStudent, setEditingStudent] = useState<User | null>(null);

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

  const handleAddStudent = () => {
    if (!newStudent.displayName) return;

    const student: User = {
      id: Date.now().toString(),
      displayName: newStudent.displayName,
      role: newStudent.role as UserRole,
      classCode: newStudent.classCode || generateClassCode(),
      password: newStudent.password || generatePassword(),
    };

    setStudents([...students, student]);
    setNewStudent({
      displayName: "",
      role: "Student",
      classCode: "",
      password: "",
    });
    setIsAddDialogOpen(false);
  };

  const handleEditStudent = () => {
    if (!editingStudent) return;

    setStudents(
      students.map((student) =>
        student.id === editingStudent.id ? editingStudent : student,
      ),
    );
    setEditingStudent(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(students.filter((student) => student.id !== id));
  };

  const startEditStudent = (student: User) => {
    setEditingStudent({ ...student });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Student Management
          </h1>
          <p className="text-muted-foreground">
            Manage student accounts, roles, and access credentials.
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Create a new student account with auto-generated credentials.
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
                    setNewStudent({ ...newStudent, role: value as UserRole })
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
                      setNewStudent({ ...newStudent, password: e.target.value })
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
                onClick={() => setIsAddDialogOpen(false)}
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
        <CardHeader>
          <CardTitle>Student Accounts</CardTitle>
          <CardDescription>
            Manage all student accounts and their access credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditStudent}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

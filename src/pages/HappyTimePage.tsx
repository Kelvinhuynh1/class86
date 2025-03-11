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
import { HappyTimeTask } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Plus, Edit, Trash2, Calendar, Clock, CheckCircle } from "lucide-react";
import { format, addDays, isAfter, isBefore } from "date-fns";

export default function HappyTimePage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<HappyTimeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<HappyTimeTask>>({
    title: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    expiryDate: addDays(new Date(), 7).toISOString().split("T")[0],
    completed: false,
  });
  const [editingTask, setEditingTask] = useState<HappyTimeTask | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Check if happy_time_tasks table exists
      const { error: checkError } = await supabase
        .from("happy_time_tasks")
        .select("id")
        .limit(1);

      if (checkError && checkError.code === "42P01") {
        // Create table if it doesn't exist
        await createHappyTimeTasksTable();
      }

      // Fetch tasks from Supabase
      const { data, error } = await supabase
        .from("happy_time_tasks")
        .select("*")
        .order("expiryDate", { ascending: true });

      if (error) throw error;

      if (data) {
        // Transform to our HappyTimeTask type
        const transformedTasks: HappyTimeTask[] = data.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          assignedTo: task.assigned_to,
          startDate: task.start_date,
          expiryDate: task.expiry_date,
          completed: task.completed,
        }));

        setTasks(transformedTasks);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setTasks(demoTasks);
    } finally {
      setLoading(false);
    }
  };

  const createHappyTimeTasksTable = async () => {
    try {
      // Create the happy_time_tasks table
      await supabase.rpc("create_happy_time_tasks_table");
    } catch (err) {
      console.error("Error creating happy_time_tasks table:", err);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || !user) return;

    try {
      const task = {
        title: newTask.title,
        description: newTask.description || "",
        assigned_to: user.id,
        start_date: newTask.startDate,
        expiry_date: newTask.expiryDate,
        completed: false,
      };

      // Add task to Supabase
      const { data, error } = await supabase
        .from("happy_time_tasks")
        .insert([task])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        // Add to local state
        const newTaskWithId: HappyTimeTask = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description,
          assignedTo: data[0].assigned_to,
          startDate: data[0].start_date,
          expiryDate: data[0].expiry_date,
          completed: data[0].completed,
        };

        setTasks([...tasks, newTaskWithId]);
      }

      // Reset form
      setNewTask({
        title: "",
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        expiryDate: addDays(new Date(), 7).toISOString().split("T")[0],
        completed: false,
      });
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const handleEditTask = async () => {
    if (!editingTask) return;

    try {
      // Update task in Supabase
      const { error } = await supabase
        .from("happy_time_tasks")
        .update({
          title: editingTask.title,
          description: editingTask.description,
          start_date: editingTask.startDate,
          expiry_date: editingTask.expiryDate,
          completed: editingTask.completed,
        })
        .eq("id", editingTask.id);

      if (error) throw error;

      // Update local state
      setTasks(
        tasks.map((task) => (task.id === editingTask.id ? editingTask : task)),
      );
      setEditingTask(null);
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      // Delete task from Supabase
      const { error } = await supabase
        .from("happy_time_tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      // Update task in Supabase
      const { error } = await supabase
        .from("happy_time_tasks")
        .update({ completed: !completed })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, completed: !completed } : task,
        ),
      );
    } catch (err) {
      console.error("Error toggling task completion:", err);
    }
  };

  const startEditTask = (task: HappyTimeTask) => {
    setEditingTask({ ...task });
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  const getTaskStatus = (task: HappyTimeTask) => {
    if (task.completed) {
      return { status: "completed", color: "bg-green-100 text-green-800" };
    }

    const now = new Date();
    const expiryDate = new Date(task.expiryDate);
    const startDate = new Date(task.startDate);

    if (isBefore(now, startDate)) {
      return { status: "upcoming", color: "bg-blue-100 text-blue-800" };
    } else if (isAfter(now, expiryDate)) {
      return { status: "expired", color: "bg-red-100 text-red-800" };
    } else {
      return { status: "active", color: "bg-yellow-100 text-yellow-800" };
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeTab="happy-time">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="happy-time">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Happy Time Tasks
            </h1>
            <p className="text-muted-foreground">
              Manage your personal tasks and activities.
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
                <DialogDescription>
                  Create a new task for your happy time activities.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="taskTitle">Task Title</Label>
                  <Input
                    id="taskTitle"
                    placeholder="Enter task title"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskDescription">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="taskDescription"
                    placeholder="Enter task description"
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newTask.startDate}
                      onChange={(e) =>
                        setNewTask({ ...newTask, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={newTask.expiryDate}
                      onChange={(e) =>
                        setNewTask({ ...newTask, expiryDate: e.target.value })
                      }
                    />
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
                <Button onClick={handleAddTask} disabled={!newTask.title}>
                  Add Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.length === 0 ? (
            <div className="col-span-full text-center p-6 border rounded-md bg-muted/50">
              <p className="text-muted-foreground mb-4">
                No tasks found. Create one to get started.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Task
              </Button>
            </div>
          ) : (
            tasks.map((task) => {
              const { status, color } = getTaskStatus(task);
              return (
                <Card key={task.id} className="overflow-hidden">
                  <div className="h-2 bg-primary"></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() =>
                            handleToggleComplete(task.id, task.completed)
                          }
                          id={`task-${task.id}`}
                        />
                        <Label
                          htmlFor={`task-${task.id}`}
                          className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {task.title}
                        </Label>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditTask(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {task.description && (
                      <p className="text-sm mb-4">{task.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" /> Start:{" "}
                        {formatDate(task.startDate)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" /> Expires:{" "}
                        {formatDate(task.expiryDate)}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        handleToggleComplete(task.id, task.completed)
                      }
                    >
                      {task.completed ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Mark as Incomplete
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" /> Mark as
                          Complete
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>

        {/* Edit Task Dialog */}
        {editingTask && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogDescription>
                  Update task details and status.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-taskTitle">Task Title</Label>
                  <Input
                    id="edit-taskTitle"
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-taskDescription">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="edit-taskDescription"
                    value={editingTask.description || ""}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startDate">Start Date</Label>
                    <Input
                      id="edit-startDate"
                      type="date"
                      value={editingTask.startDate}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-expiryDate">Expiry Date</Label>
                    <Input
                      id="edit-expiryDate"
                      type="date"
                      value={editingTask.expiryDate}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          expiryDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-completed"
                    checked={editingTask.completed}
                    onCheckedChange={(checked) =>
                      setEditingTask({
                        ...editingTask,
                        completed: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="edit-completed">Mark as completed</Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditTask}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}

// Demo data for fallback when Supabase connection fails
const demoTasks: HappyTimeTask[] = [
  {
    id: "1",
    title: "Complete Math Assignment",
    description: "Finish all problems in Chapter 5",
    assignedTo: "user1",
    startDate: "2023-05-01",
    expiryDate: "2023-05-10",
    completed: false,
  },
  {
    id: "2",
    title: "Study for Science Test",
    description: "Focus on chemistry section",
    assignedTo: "user1",
    startDate: "2023-05-05",
    expiryDate: "2023-05-15",
    completed: true,
  },
  {
    id: "3",
    title: "Read History Chapter",
    description: "Take notes on important events",
    assignedTo: "user1",
    startDate: "2023-05-12",
    expiryDate: "2023-05-20",
    completed: false,
  },
];

import { useState, useEffect, useRef } from "react";
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
import { Task } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  CheckCircle,
  MessageSquare,
  Send,
} from "lucide-react";
import { format, isToday, isPast, isFuture } from "date-fns";

interface Comment {
  id: string;
  taskId: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export default function TodoPage() {
  const { user, hasPermission } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState<Record<string, boolean>>(
    {},
  );
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    completed: false,
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<
    "all" | "today" | "upcoming" | "completed"
  >("all");
  const canEditTasks = hasPermission(["Leader", "Co-Leader"]);
  const commentInputRefs = useRef<Record<string, HTMLInputElement>>({});

  useEffect(() => {
    fetchTasks();
    setupRealtimeSubscription();

    return () => {
      supabase.removeChannel(supabase.channel("todo_tasks_changes"));
      supabase.removeChannel(supabase.channel("task_comments_changes"));
    };
  }, []);

  const setupRealtimeSubscription = () => {
    // Subscribe to task changes
    supabase
      .channel("todo_tasks_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todo_tasks" },
        (payload) => {
          fetchTasks();
        },
      )
      .subscribe();

    // Subscribe to comment changes
    supabase
      .channel("task_comments_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_comments" },
        (payload) => {
          if (payload.new && (payload.new as any).task_id) {
            fetchComments((payload.new as any).task_id);
          }
        },
      )
      .subscribe();
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Check if todo_tasks table exists
      const { error: checkError } = await supabase
        .from("todo_tasks")
        .select("id")
        .limit(1);

      if (checkError && checkError.code === "42P01") {
        // Create table if it doesn't exist
        await createTodoTasksTable();
      }

      // Fetch tasks from Supabase
      const { data, error } = await supabase
        .from("todo_tasks")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;

      if (data) {
        // Transform to our Task type
        const transformedTasks: Task[] = data.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.due_date,
          subject: task.subject,
          assignedTo: task.assigned_to ? [task.assigned_to] : [],
          completed: task.completed,
          createdBy: task.created_by,
          createdAt: task.created_at,
        }));

        setTasks(transformedTasks);

        // Fetch comments for each task
        transformedTasks.forEach((task) => {
          fetchComments(task.id);
        });
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (taskId: string) => {
    try {
      // Check if task_comments table exists
      const { error: checkError } = await supabase
        .from("task_comments")
        .select("id")
        .limit(1);

      if (checkError && checkError.code === "42P01") {
        // Create table if it doesn't exist
        await createTaskCommentsTable();
      }

      const { data, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data) {
        const transformedComments: Comment[] = data.map((comment) => ({
          id: comment.id,
          taskId: comment.task_id,
          content: comment.content,
          createdBy: comment.created_by,
          createdAt: comment.created_at,
        }));

        setComments((prev) => ({
          ...prev,
          [taskId]: transformedComments,
        }));
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const createTodoTasksTable = async () => {
    try {
      // Create the todo_tasks table
      const { error } = await supabase.rpc("create_todo_tasks_table");
      if (error) throw error;
    } catch (err) {
      console.error("Error creating todo_tasks table:", err);
    }
  };

  const createTaskCommentsTable = async () => {
    try {
      // Create SQL for task_comments table
      const { error } = await supabase.rpc("create_task_comments_table");
      if (error) throw error;
    } catch (err) {
      console.error("Error creating task_comments table:", err);
    }
  };

  const addComment = async (taskId: string) => {
    if (!user || !newComment[taskId]?.trim()) return;

    try {
      const comment = {
        task_id: taskId,
        content: newComment[taskId],
        created_by: user.displayName,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("task_comments").insert([comment]);

      if (error) throw error;

      // Clear input field
      setNewComment((prev) => ({
        ...prev,
        [taskId]: "",
      }));

      // Focus back on input
      if (commentInputRefs.current[taskId]) {
        commentInputRefs.current[taskId].focus();
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const toggleComments = (taskId: string) => {
    setIsCommentsOpen((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleAddTask = async () => {
    if (!newTask.title || !user || !canEditTasks) return;

    try {
      const task = {
        title: newTask.title,
        description: newTask.description || "",
        due_date: newTask.dueDate,
        subject: newTask.subject,
        assigned_to: user.id,
        completed: false,
        created_by: user.displayName,
        created_at: new Date().toISOString(),
      };

      // Add task to Supabase
      const { data, error } = await supabase
        .from("todo_tasks")
        .insert([task])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        // Add to local state
        const newTaskWithId: Task = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description,
          dueDate: data[0].due_date,
          subject: data[0].subject,
          assignedTo: data[0].assigned_to ? [data[0].assigned_to] : [],
          completed: data[0].completed,
          createdBy: data[0].created_by,
          createdAt: data[0].created_at,
        };

        setTasks([...tasks, newTaskWithId]);
      }

      // Reset form
      setNewTask({
        title: "",
        description: "",
        dueDate: new Date().toISOString().split("T")[0],
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
        .from("todo_tasks")
        .update({
          title: editingTask.title,
          description: editingTask.description,
          due_date: editingTask.dueDate,
          subject: editingTask.subject,
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
      const { error } = await supabase.from("todo_tasks").delete().eq("id", id);

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
        .from("todo_tasks")
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

  const startEditTask = (task: Task) => {
    setEditingTask({ ...task });
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  const getFilteredTasks = () => {
    return tasks.filter((task) => {
      const taskDate = new Date(task.dueDate);
      switch (filter) {
        case "today":
          return isToday(taskDate);
        case "upcoming":
          return isFuture(taskDate) && !isToday(taskDate);
        case "completed":
          return task.completed;
        default:
          return true;
      }
    });
  };

  if (loading) {
    return (
      <DashboardLayout activeTab="todo">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="todo">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">To-Do Tasks</h1>
            <p className="text-muted-foreground">
              {canEditTasks
                ? "Manage class tasks and assignments"
                : "View class tasks and assignments"}
            </p>
          </div>

          {canEditTasks && (
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
                    Create a new task or assignment.
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

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject (Optional)</Label>
                    <Input
                      id="subject"
                      placeholder="e.g. Math, Science"
                      value={newTask.subject}
                      onChange={(e) =>
                        setNewTask({ ...newTask, subject: e.target.value })
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
                  <Button onClick={handleAddTask} disabled={!newTask.title}>
                    Add Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All Tasks
          </Button>
          <Button
            variant={filter === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("today")}
          >
            Today
          </Button>
          <Button
            variant={filter === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Completed
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {getFilteredTasks().length === 0 ? (
            <div className="col-span-full text-center p-6 border rounded-md bg-muted/50">
              <p className="text-muted-foreground mb-4">
                {filter === "all"
                  ? "No tasks found."
                  : `No ${filter} tasks found.`}
              </p>
              {canEditTasks && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
              )}
            </div>
          ) : (
            getFilteredTasks().map((task) => (
              <Card key={task.id} className="overflow-hidden">
                <div
                  className={`h-2 ${task.completed ? "bg-green-500" : "bg-blue-500"}`}
                ></div>
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
                      {canEditTasks && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                  {task.subject && (
                    <CardDescription>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {task.subject}
                      </span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {task.description && (
                    <p className="text-sm mb-4">{task.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" /> Due:{" "}
                      {formatDate(task.dueDate)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created by {task.createdBy} on{" "}
                      {formatDate(task.createdAt)}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3">
                  {canEditTasks && (
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
                  )}

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => toggleComments(task.id)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Comments ({comments[task.id]?.length || 0})
                  </Button>

                  {isCommentsOpen[task.id] && (
                    <div className="w-full border rounded-md p-3 space-y-3">
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {comments[task.id]?.length ? (
                          comments[task.id].map((comment) => (
                            <div
                              key={comment.id}
                              className="text-sm border-b pb-2"
                            >
                              <div className="font-medium">
                                {comment.createdBy}
                              </div>
                              <div>{comment.content}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(
                                  new Date(comment.createdAt),
                                  "MMM d, h:mm a",
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground text-center">
                            No comments yet
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Input
                          placeholder="Add a comment..."
                          value={newComment[task.id] || ""}
                          onChange={(e) =>
                            setNewComment((prev) => ({
                              ...prev,
                              [task.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              addComment(task.id);
                            }
                          }}
                          ref={(el) => {
                            if (el) commentInputRefs.current[task.id] = el;
                          }}
                        />
                        <Button
                          size="icon"
                          onClick={() => addComment(task.id)}
                          disabled={!newComment[task.id]?.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))
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

                <div className="space-y-2">
                  <Label htmlFor="edit-dueDate">Due Date</Label>
                  <Input
                    id="edit-dueDate"
                    type="date"
                    value={editingTask.dueDate}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        dueDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-subject">Subject (Optional)</Label>
                  <Input
                    id="edit-subject"
                    value={editingTask.subject || ""}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        subject: e.target.value,
                      })
                    }
                  />
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

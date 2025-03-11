import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Send,
  Calendar,
  CheckCircle2,
  Circle,
  CalendarIcon,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";
import {
  format,
  isToday,
  isPast,
  addDays,
  isSameDay,
  isWithinInterval,
} from "date-fns";

interface TodoTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  completed: boolean;
  created_by: string;
  assigned_to: string | null;
  subject: string | null;
  created_at: string;
  updated_at: string | null;
}

interface UserCompletedTask {
  id: string;
  user_id: string;
  task_id: string;
  completed_at: string;
}

export default function TodoPage() {
  const { user, hasPermission } = useAuth();
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [userCompletedTasks, setUserCompletedTasks] = useState<
    Record<string, UserCompletedTask[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const canEditTasks = hasPermission(["Leader", "Co-Leader", "Admin"]);

  useEffect(() => {
    fetchTasks();
    fetchUserCompletedTasks();

    // Set up realtime subscriptions
    const tasksSubscription = supabase
      .channel("todo_tasks_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todo_tasks" },
        () => fetchTasks(),
      )
      .subscribe();

    const completedTasksSubscription = supabase
      .channel("user_completed_tasks_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_completed_tasks" },
        () => fetchUserCompletedTasks(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSubscription);
      supabase.removeChannel(completedTasksSubscription);
    };
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("todo_tasks")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;

      if (data) {
        setTasks(data);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCompletedTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("user_completed_tasks")
        .select("*");

      if (error) throw error;

      if (data) {
        // Group by task_id
        const grouped: Record<string, UserCompletedTask[]> = {};
        data.forEach((task) => {
          if (!grouped[task.task_id]) {
            grouped[task.task_id] = [];
          }
          grouped[task.task_id].push(task);
        });
        setUserCompletedTasks(grouped);
      }
    } catch (err) {
      console.error("Error fetching user completed tasks:", err);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim() || !user || !canEditTasks) return;

    try {
      const { data, error } = await supabase
        .from("todo_tasks")
        .insert([
          {
            title: newTaskText,
            description: null,
            due_date: newTaskDueDate,
            completed: false,
            created_by: user.displayName,
            assigned_to: null,
            subject: null,
          },
        ])
        .select();

      if (error) throw error;

      // Reset form
      setNewTaskText("");
      setNewTaskDueDate(new Date().toISOString().split("T")[0]);
      setShowDatePicker(false);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("todo_tasks")
        .delete()
        .eq("id", taskId);
      if (error) throw error;

      // Update local state
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleEditTask = async () => {
    if (!editingTask || !user || !canEditTasks) return;

    try {
      const { error } = await supabase
        .from("todo_tasks")
        .update({
          title: editingTask.title,
          description: editingTask.description,
          due_date: editingTask.due_date,
          updated_at: new Date().toISOString(),
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

  const handleToggleTaskCompletion = async (taskId: string) => {
    if (!user) return;

    try {
      // Check if user has already completed this task
      const userCompletedTask = userCompletedTasks[taskId]?.find(
        (t) => t.user_id === user.id,
      );

      if (userCompletedTask) {
        // User has completed this task, so remove it
        const { error } = await supabase
          .from("user_completed_tasks")
          .delete()
          .eq("id", userCompletedTask.id);

        if (error) throw error;

        // Update local state
        setUserCompletedTasks((prev) => ({
          ...prev,
          [taskId]: (prev[taskId] || []).filter(
            (t) => t.id !== userCompletedTask.id,
          ),
        }));
      } else {
        // User has not completed this task, so add it
        const { data, error } = await supabase
          .from("user_completed_tasks")
          .insert([
            {
              user_id: user.id,
              task_id: taskId,
              completed_at: new Date().toISOString(),
            },
          ])
          .select();

        if (error) throw error;

        if (data) {
          // Update local state
          setUserCompletedTasks((prev) => ({
            ...prev,
            [taskId]: [...(prev[taskId] || []), data[0]],
          }));
        }
      }

      // Check if all users have completed the task
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        // For simplicity, we'll just mark the task as completed if the current user completes it
        const completed = !userCompletedTask;

        // Update the task's completed status if needed
        if (completed !== task.completed) {
          const { error } = await supabase
            .from("todo_tasks")
            .update({ completed })
            .eq("id", taskId);

          if (error) throw error;

          // Update local state
          setTasks(
            tasks.map((t) => (t.id === taskId ? { ...t, completed } : t)),
          );
        }
      }
    } catch (err) {
      console.error("Error toggling task completion:", err);
    }
  };

  const isTaskCompletedByUser = (taskId: string, userId: string) => {
    return (
      userCompletedTasks[taskId]?.some((t) => t.user_id === userId) || false
    );
  };

  // Group tasks by their status and user completion status
  const todayTasks = tasks.filter(
    (task) => isToday(new Date(task.due_date)) && !isTaskCompletedByUser(task.id, user?.id || ""),
  );
  const upcomingTasks = tasks.filter((task) => {
    const dueDate = new Date(task.due_date);
    return !isToday(dueDate) && !isTaskCompletedByUser(task.id, user?.id || "") && !isPast(dueDate);
  });
  const pastDueTasks = tasks.filter((task) => {
    const dueDate = new Date(task.due_date);
    return isPast(dueDate) && !isToday(dueDate) && !isTaskCompletedByUser(task.id, user?.id || "");
  });
  const completedTasks = tasks.filter((task) => isTaskCompletedByUser(task.id, user?.id || ""));

  // Group upcoming tasks by date range
  const groupedUpcomingTasks: Record<string, TodoTask[]> = {};
  upcomingTasks.forEach((task) => {
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const tomorrow = addDays(today, 1);

    if (isSameDay(dueDate, tomorrow)) {
      const key = "Tomorrow";
      if (!groupedUpcomingTasks[key]) groupedUpcomingTasks[key] = [];
      groupedUpcomingTasks[key].push(task);
    } else {
      // Group by week
      const startOfWeek = addDays(today, 2); // Start from day after tomorrow
      const endOfWeek = addDays(today, 7);
      const nextWeekStart = addDays(today, 8);
      const nextWeekEnd = addDays(today, 14);

      if (isWithinInterval(dueDate, { start: startOfWeek, end: endOfWeek })) {
        const key = `This Week (${format(startOfWeek, "EEE d")} - ${format(endOfWeek, "EEE d")})`;
        if (!groupedUpcomingTasks[key]) groupedUpcomingTasks[key] = [];
        groupedUpcomingTasks[key].push(task);
      } else if (
        isWithinInterval(dueDate, { start: nextWeekStart, end: nextWeekEnd })
      ) {
        const key = `Next Week (${format(nextWeekStart, "EEE d")} - ${format(nextWeekEnd, "EEE d")})`;
        if (!groupedUpcomingTasks[key]) groupedUpcomingTasks[key] = [];
        groupedUpcomingTasks[key].push(task);
      } else {
        const key = "Later";
        if (!groupedUpcomingTasks[key]) groupedUpcomingTasks[key] = [];
        groupedUpcomingTasks[key].push(task);
      }
    }
  });

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">To-Do Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track class tasks and assignments.
          </p>
        </div>

        <Card className="flex flex-col h-[calc(100vh-16rem)]">
          <CardHeader className="pb-2">
            <CardTitle>Tasks ({tasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-6">
                {/* Today's tasks */}
                {todayTasks.length > 0 && (
                  <div>
                    <div
                      className="flex justify-between items-center mb-2 cursor-pointer"
                      onClick={() =>
                        document
                          .getElementById("today-tasks")
                          ?.classList.toggle("hidden")
                      }
                    >
                      <h3 className="font-medium text-sm flex items-center">
                        <Badge variant="outline" className="mr-2">
                          Today ({todayTasks.length})
                        </Badge>
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        Click to expand/collapse
                      </span>
                    </div>
                    <div id="today-tasks">
                      <div className="space-y-2">
                        {todayTasks.map((task) => {
                          const isCompleted = isTaskCompletedByUser(
                            task.id,
                            user?.id || "",
                          );
                          return (
                            <div
                              key={task.id}
                              className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md"
                            >
                              <div className="mt-1">
                                <div
                                  onClick={() => handleToggleTaskCompletion(task.id)}
                                  className="h-5 w-5 rounded border flex items-center justify-center cursor-pointer"
                                >
                                  {isCompleted && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div
                                    className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}
                                  >
                                    {task.title}
                                  </div>
                                  {canEditTasks && (
                                    <div className="flex space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          // Show edit dialog
                                          setEditingTask(task);
                                          setIsEditDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          const taskId = task.id;
                                          deleteTask(taskId);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>Today</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Past due tasks */}
                {pastDueTasks.length > 0 && (
                  <div>
                    <div
                      className="flex justify-between items-center mb-2 cursor-pointer"
                      onClick={() =>
                        document
                          .getElementById("overdue-tasks")
                          ?.classList.toggle("hidden")
                      }
                    >
                      <h3 className="font-medium text-sm flex items-center">
                        <Badge variant="destructive" className="mr-2">
                          Overdue ({pastDueTasks.length})
                        </Badge>
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        Click to expand/collapse
                      </span>
                    </div>
                    <div id="overdue-tasks">
                      <div className="space-y-2">
                        {pastDueTasks.map((task) => {
                          const isCompleted = isTaskCompletedByUser(
                            task.id,
                            user?.id || "",
                          );
                          return (
                            <div
                              key={task.id}
                              className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md"
                            >
                              <div className="mt-1">
                                <div
                                  onClick={() => handleToggleTaskCompletion(task.id)}
                                  className="h-5 w-5 rounded border flex items-center justify-center cursor-pointer"
                                >
                                  {isCompleted && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div
                                    className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : "text-red-500"}`}
                                  >
                                    {task.title}
                                  </div>
                                  {canEditTasks && (
                                    <div className="flex space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          // Show edit dialog
                                          setEditingTask(task);
                                          setIsEditDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          const taskId = task.id;
                                          deleteTask(taskId);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center text-xs text-red-500 mt-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>
                                    Due{" "}
                                    {format(
                                      new Date(task.due_date),
                                      "EEE, MMM d",
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upcoming tasks grouped by date range */}
                {Object.entries(groupedUpcomingTasks).map(
                  ([dateRange, tasks]) => (
                    <div key={dateRange}>
                      <div
                        className="flex justify-between items-center mb-2 cursor-pointer"
                        onClick={() =>
                          document
                            .getElementById(
                              `tasks-${dateRange.replace(/[^a-zA-Z0-9]/g, "-")}`,
                            )
                            ?.classList.toggle("hidden")
                        }
                      >
                        <h3 className="font-medium text-sm flex items-center">
                          <Badge variant="outline" className="mr-2">
                            {dateRange} ({tasks.length})
                          </Badge>
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          Click to expand/collapse
                        </span>
                      </div>
                      <div
                        id={`tasks-${dateRange.replace(/[^a-zA-Z0-9]/g, "-")}`}
                      >
                        <div className="space-y-2">
                          {tasks.map((task) => {
                            const isCompleted = isTaskCompletedByUser(
                              task.id,
                              user?.id || "",
                            );
                            return (
                              <div
                                key={task.id}
                                className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md"
                              >
                                <div className="mt-1">
                                  <div
                                    onClick={() => handleToggleTaskCompletion(task.id)}
                                    className="h-5 w-5 rounded border flex items-center justify-center cursor-pointer"
                                  >
                                    {isCompleted && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div
                                      className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}
                                    >
                                      {task.title}
                                    </div>
                                    {canEditTasks && (
                                      <div className="flex space-x-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            // Show edit dialog
                                            setEditingTask(task);
                                            setIsEditDialogOpen(true);
                                          }}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            const taskId = task.id;
                                            deleteTask(taskId);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    <span>
                                      Due{" "}
                                      {format(
                                        new Date(task.due_date),
                                        "EEE, MMM d",
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ),
                )}

                {/* Completed tasks */}
                {completedTasks.length > 0 && (
                  <div>
                    <div
                      className="flex justify-between items-center mb-2 cursor-pointer"
                      onClick={() =>
                        document
                          .getElementById("completed-tasks")
                          ?.classList.toggle("hidden")
                      }
                    >
                      <h3 className="font-medium text-sm flex items-center">
                        <Badge variant="secondary" className="mr-2">
                          Completed ({completedTasks.length})
                        </Badge>
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        Click to expand/collapse
                      </span>
                    </div>
                    <div id="completed-tasks" className="hidden">
                      <div className="space-y-2">
                        {completedTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md"
                          >
                            <div className="mt-1">
                              <div
                                onClick={() => handleToggleTaskCompletion(task.id)}
                                className="h-5 w-5 rounded border flex items-center justify-center cursor-pointer bg-primary/10"
                              >
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div className="font-medium line-through text-muted-foreground">
                                  {task.title}
                                </div>
                                {canEditTasks && (
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        const taskId = task.id;
                                        deleteTask(taskId);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>Completed</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {tasks.length === 0 && (
                  <div className="text-center p-6">
                    <p className="text-muted-foreground">
                      No tasks yet. {canEditTasks ? "Add a task below." : ""}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          {canEditTasks && (
            <div className="p-4 border-t">
              <div className="flex flex-col space-y-2">
                {showDatePicker && (
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                )}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a new task..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddTask();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleAddTask}
                    disabled={!newTaskText.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Task Dialog */}
          {editingTask && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Task Title</Label>
                    <Input
                      id="edit-title"
                      value={editingTask.title}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="edit-description"
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
                      value={editingTask.due_date.split("T")[0]}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          due_date: e.target.value,
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
                    onClick={handleEditTask}
                    disabled={!editingTask.title || !editingTask.due_date}
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

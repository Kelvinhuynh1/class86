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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Note } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Plus, Edit, Trash2, Calendar, Star, BookMarked } from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import DailyNotes from "@/components/notes/DailyNotes";
import ImportantNotes from "@/components/notes/ImportantNotes";
import AllNotes from "@/components/notes/AllNotes";

export default function NotesPage() {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState("daily");
  const canEditNotes = hasPermission(["Leader", "Co-Leader", "Admin"]);

  // Create the daily_notes and important_notes tables if they don't exist
  useEffect(() => {
    const setupTables = async () => {
      try {
        // Check if daily_notes table exists
        const { error: dailyError } = await supabase
          .from("daily_notes")
          .select("id")
          .limit(1);

        if (dailyError && dailyError.code === "42P01") {
          // Table doesn't exist, create it
          const createDailyNotesTable = async () => {
            await supabase.rpc("create_daily_notes_table");
          };
          createDailyNotesTable();
        }

        // Check if important_notes table exists
        const { error: importantError } = await supabase
          .from("important_notes")
          .select("id")
          .limit(1);

        if (importantError && importantError.code === "42P01") {
          // Table doesn't exist, create it
          const createImportantNotesTable = async () => {
            await supabase.rpc("create_important_notes_table");
          };
          createImportantNotesTable();
        }
      } catch (err) {
        console.error("Error setting up tables:", err);
      }
    };

    setupTables();
  }, []);

  return (
    <DashboardLayout activeTab="notes">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Class Notes</h1>
            <p className="text-muted-foreground">
              {canEditNotes
                ? "Create and manage notes for your class."
                : "View important notes and daily updates."}
            </p>
          </div>
        </div>

        <Tabs
          defaultValue="daily"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily" className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" /> Daily Notes
            </TabsTrigger>
            <TabsTrigger value="important" className="flex items-center">
              <Star className="h-4 w-4 mr-2 text-yellow-500" /> Important Notes
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center">
              <BookMarked className="h-4 w-4 mr-2" /> All Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-6">
            <DailyNotes />
          </TabsContent>

          <TabsContent value="important" className="mt-6">
            <ImportantNotes />
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <AllNotes />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

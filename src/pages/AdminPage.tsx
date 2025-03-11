import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StudentManagement from "@/components/admin/StudentManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("students");

  return (
    <DashboardLayout activeTab="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage students, timetables, and other administrative tasks.
          </p>
        </div>

        <Tabs
          defaultValue="students"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students" className="flex items-center">
              <Users className="mr-2 h-4 w-4" /> Student Management
            </TabsTrigger>
            <TabsTrigger value="timetable" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" /> Timetable Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-6">
            <StudentManagement />
          </TabsContent>

          <TabsContent value="timetable" className="mt-6">
            <div className="text-center p-6 text-muted-foreground">
              Timetable management coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

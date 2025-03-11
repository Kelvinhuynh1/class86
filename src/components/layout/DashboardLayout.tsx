import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserCircle,
  Calendar,
  BookOpen,
  Link,
  FileText,
  HelpCircle,
  PartyPopper,
  CheckSquare,
  MessageSquare,
  Users,
  BookMarked,
  GamepadIcon,
  Flame,
  Settings,
  ShieldAlert,
  Mail,
  Gamepad2,
  FileEdit,
  Star,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab?: string;
}

export default function DashboardLayout({
  children,
  activeTab = "calendar",
}: DashboardLayoutProps) {
  const { user, signOut, hasPermission } = useAuth();
  const { hasUnreadMessages } = useNotification();
  const navigate = useNavigate();

  const handleTabChange = (value: string) => {
    navigate(`/${value}`);
  };

  // Define tabs available to all users including students
  const studentTabs = [
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Notes", href: "/notes", icon: FileEdit },
    { name: "Study Links", href: "/study-links", icon: Link },
    { name: "Study Files", href: "/study-files", icon: FileText },
    { name: "Questions", href: "/questions", icon: HelpCircle },
    { name: "To-Do Tasks", href: "/todo", icon: CheckSquare },
    { name: "Class Chat", href: "/chat", icon: MessageSquare },
    { name: "Direct Messages", href: "/direct-chat", icon: Mail },
    { name: "Teams", href: "/teams", icon: Users },
    { name: "Gaming", href: "/gaming", icon: Gamepad2 },
    { name: "Important Resources", href: "/important", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <h1 className="text-xl font-bold">Class Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                <span className="font-medium">{user.displayName}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {user.role}
                </span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card p-4 hidden md:block">
          <Tabs
            defaultValue={activeTab}
            orientation="vertical"
            className="w-full"
            onValueChange={handleTabChange}
          >
            <TabsList className="flex flex-col h-auto w-full gap-1">
              <TabsTrigger value="calendar" className="justify-start w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>

              <TabsTrigger value="notes" className="justify-start w-full">
                <FileEdit className="h-4 w-4 mr-2" />
                Notes
              </TabsTrigger>

              <TabsTrigger value="important" className="justify-start w-full">
                <Flame className="h-4 w-4 mr-2" />
                Important Resources
              </TabsTrigger>

              <TabsTrigger value="study-links" className="justify-start w-full">
                <Link className="h-4 w-4 mr-2" />
                Study Links
              </TabsTrigger>

              <TabsTrigger value="study-files" className="justify-start w-full">
                <FileText className="h-4 w-4 mr-2" />
                Study Files
              </TabsTrigger>

              <TabsTrigger value="questions" className="justify-start w-full">
                <HelpCircle className="h-4 w-4 mr-2" />
                Questions
              </TabsTrigger>

              <TabsTrigger value="todo" className="justify-start w-full">
                <CheckSquare className="h-4 w-4 mr-2" />
                To-Do Tasks
              </TabsTrigger>

              <TabsTrigger
                value="chat"
                className="justify-start w-full relative"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Class Chat
                {hasUnreadMessages && activeTab !== "chat" && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="direct-chat"
                className="justify-start w-full relative"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Direct Messages
                {hasUnreadMessages && activeTab !== "direct-chat" && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="posts"
                className="justify-start w-full relative"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Posts
                {hasUnreadMessages && activeTab !== "posts" && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </TabsTrigger>

              <TabsTrigger value="teams" className="justify-start w-full">
                <Users className="h-4 w-4 mr-2" />
                Teams
              </TabsTrigger>

              <TabsTrigger
                value="gaming"
                className="justify-start w-full relative"
              >
                <GamepadIcon className="h-4 w-4 mr-2" />
                Gaming
                {hasUnreadMessages && activeTab !== "gaming" && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </TabsTrigger>

              {hasPermission("Admin") && (
                <TabsTrigger value="admin" className="justify-start w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Student Management
                </TabsTrigger>
              )}

              <TabsTrigger value="adminpanel" className="justify-start w-full">
                <ShieldAlert className="h-4 w-4 mr-2" />
                Admin Panel
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

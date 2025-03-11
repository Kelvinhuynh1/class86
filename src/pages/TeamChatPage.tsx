import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Send, PaperclipIcon } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender: string;
  sender_name: string;
  timestamp: string;
  team_id: string;
}

interface Team {
  id: string;
  name: string;
  members: string[];
  owner?: string;
}

export default function TeamChatPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!teamId || !user) return;

    const fetchTeam = async () => {
      try {
        const { data, error } = await supabase
          .from("teams")
          .select("*")
          .eq("id", teamId)
          .single();

        if (error) throw error;

        if (data) {
          setTeam({
            id: data.id,
            name: data.name,
            members: data.members || [],
            owner: data.owner,
          });

          // Check if user is a member of this team
          if (!data.members.includes(user.id) && data.owner !== user.id) {
            // Not a member, redirect to teams page
            window.location.href = "/teams";
          }
        }
      } catch (err) {
        console.error("Error fetching team:", err);
      }
    };

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("team_messages")
          .select("*")
          .eq("team_id", teamId)
          .order("timestamp", { ascending: true });

        if (error) throw error;

        if (data) {
          setMessages(data);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, display_name");

        if (error) throw error;

        if (data) {
          const memberMap: Record<string, string> = {};
          data.forEach((user) => {
            memberMap[user.id] = user.display_name;
          });
          setMembers(memberMap);
        }
      } catch (err) {
        console.error("Error fetching members:", err);
      }
    };

    // Create team_messages table if it doesn't exist
    const createTeamMessagesTable = async () => {
      try {
        // Check if table exists
        const { error } = await supabase
          .from("team_messages")
          .select("id")
          .limit(1);

        if (error && error.code === "42P01") {
          // Table doesn't exist, create it
          const createTableSQL = `
            CREATE TABLE IF NOT EXISTS public.team_messages (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              content TEXT NOT NULL,
              sender TEXT NOT NULL,
              sender_name TEXT NOT NULL,
              team_id TEXT NOT NULL,
              timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
            
            ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Team messages are viewable by team members"
              ON public.team_messages FOR SELECT
              USING (true);
              
            CREATE POLICY "Team messages can be inserted by team members"
              ON public.team_messages FOR INSERT
              WITH CHECK (true);
              
            ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
          `;

          await supabase.rpc("exec_sql", { sql: createTableSQL });
        }
      } catch (err) {
        console.error("Error creating team_messages table:", err);
      }
    };

    createTeamMessagesTable();
    fetchTeam();
    fetchMessages();
    fetchMembers();

    // Set up realtime subscription
    const subscription = supabase
      .channel("team_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_messages",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          // Add new message to state
          setMessages((current) => [...current, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [teamId, user]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !teamId) return;

    try {
      const { error } = await supabase.from("team_messages").insert([
        {
          content: newMessage,
          sender: user.id,
          sender_name: user.displayName,
          team_id: teamId,
        },
      ]);

      if (error) throw error;

      // Clear input
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "h:mm a");
    } catch (e) {
      return "";
    }
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
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center">
              <span className="text-xl font-bold">
                {team?.name || "Team Chat"}
              </span>
              <span className="ml-2 text-sm text-muted-foreground">
                {team?.members?.length || 0} members
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.sender === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <Avatar className="h-8 w-8 mx-2">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_name}`}
                        />
                        <AvatarFallback>
                          {message.sender_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-lg p-3 ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-xs">
                            {message.sender_name}
                          </span>
                          <span className="text-xs opacity-70 ml-2">
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

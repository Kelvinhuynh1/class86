import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

interface ChatUserListProps {
  onSelectUser: (userId: string) => void;
  selectedUserId: string | null;
}

export default function ChatUserList({
  onSelectUser,
  selectedUserId,
}: ChatUserListProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;

    fetchUsers();
    setupUnreadMessagesSubscription();
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all users except current user
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .neq("id", user?.id || "");

      if (error) throw error;

      // Transform to our User type
      const transformedUsers: User[] = data.map((userData) => ({
        id: userData.id,
        displayName: userData.display_name,
        role: userData.role,
        classCode: userData.class_code,
        password: userData.password,
      }));

      setUsers(transformedUsers);

      // Fetch unread message counts
      fetchUnreadCounts(transformedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async (usersList: User[]) => {
    if (!user) return;

    try {
      // Fetch all unread messages for current user
      const { data, error } = await supabase
        .from("direct_messages")
        .select("sender_id, count(*)")
        .eq("recipient_id", user.id)
        .eq("read", false);

      if (error) throw error;

      // Process the data to group by sender_id manually
      const counts: Record<string, number> = {};
      if (data) {
        data.forEach((item) => {
          if (!counts[item.sender_id]) {
            counts[item.sender_id] = 0;
          }
          counts[item.sender_id] += 1;
        });
      }

      setUnreadCounts(counts);
    } catch (err) {
      console.error("Error fetching unread counts:", err);
    }
  };

  const setupUnreadMessagesSubscription = () => {
    // Play notification sound when new message arrives
    const playNotification = () => {
      try {
        const audio = new Audio("/notification.mp3");
        audio.play().catch((e) => console.log("Audio play failed:", e));
      } catch (err) {
        console.error("Failed to play notification sound:", err);
      }
    };

    if (!user) return;

    const subscription = supabase
      .channel("direct_messages_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const newMessage = payload.new as any;
          // If message is for current user and not read
          if (newMessage.recipient_id === user.id && !newMessage.read) {
            setUnreadCounts((prev) => ({
              ...prev,
              [newMessage.sender_id]: (prev[newMessage.sender_id] || 0) + 1,
            }));

            // Play notification sound
            playNotification();
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "direct_messages" },
        (payload) => {
          const updatedMessage = payload.new as any;
          // If message was marked as read
          if (updatedMessage.recipient_id === user.id && updatedMessage.read) {
            // Refresh unread counts
            fetchUnreadCounts(users);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  // Sort users by unread count (highest first) and then by name
  const sortedUsers = [...users].sort((a, b) => {
    const aUnread = unreadCounts[a.id] || 0;
    const bUnread = unreadCounts[b.id] || 0;

    // First sort by unread count (descending)
    if (aUnread !== bUnread) {
      return bUnread - aUnread;
    }

    // Then sort alphabetically by name
    return a.displayName.localeCompare(b.displayName);
  });

  const filteredUsers = sortedUsers.filter((u) =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              No users found
            </div>
          ) : (
            filteredUsers.map((chatUser) => (
              <Button
                key={chatUser.id}
                variant="ghost"
                className={`w-full justify-start mb-1 p-2 ${selectedUserId === chatUser.id ? "bg-muted" : ""}`}
                onClick={() => onSelectUser(chatUser.id)}
              >
                <div className="flex items-center w-full">
                  <div className="relative">
                    <Avatar className="h-9 w-9 mr-3">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chatUser.displayName}`}
                      />
                      <AvatarFallback>
                        {getInitials(chatUser.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    {unreadCounts[chatUser.id] &&
                      unreadCounts[chatUser.id] > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                          {unreadCounts[chatUser.id]}
                        </span>
                      )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{chatUser.displayName}</span>
                    <span className="text-xs text-muted-foreground">
                      {chatUser.role}
                    </span>
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

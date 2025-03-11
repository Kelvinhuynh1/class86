import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  GamepadIcon,
  Trophy,
  Users,
  Clock,
  Plus,
  Send,
  X,
  UserPlus,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface GameRoom {
  id: string;
  name: string;
  game: string;
  createdBy: string;
  createdAt: string;
  players: string[];
  maxPlayers: number;
}

interface GameMessage {
  id: string;
  roomId: string;
  content: string;
  sender: string;
  createdAt: string;
}

export default function GamingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("rooms");
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [messages, setMessages] = useState<Record<string, GameMessage[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<GameRoom | null>(null);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    game: "",
    maxPlayers: 10,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
    setupRealtimeSubscription();

    return () => {
      supabase.removeChannel(supabase.channel("game_rooms_changes"));
      supabase.removeChannel(supabase.channel("game_messages_changes"));
    };
  }, []);

  const setupRealtimeSubscription = () => {
    // Subscribe to room changes
    supabase
      .channel("game_rooms_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rooms" },
        (payload) => {
          fetchRooms();
        },
      )
      .subscribe();

    // Subscribe to message changes
    supabase
      .channel("game_messages_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_messages" },
        (payload) => {
          if (
            payload.new &&
            (payload.new as any).room_id &&
            selectedRoom?.id === (payload.new as any).room_id
          ) {
            fetchMessages((payload.new as any).room_id);
          }
        },
      )
      .subscribe();
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      // Check if game_rooms table exists
      const { error: checkError } = await supabase
        .from("game_rooms")
        .select("id")
        .limit(1);

      if (checkError && checkError.code === "42P01") {
        // Create table if it doesn't exist
        await createGameRoomsTables();
      }

      // Fetch rooms from Supabase
      const { data, error } = await supabase
        .from("game_rooms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Transform to our GameRoom type
        const transformedRooms: GameRoom[] = data.map((room) => ({
          id: room.id,
          name: room.name,
          game: room.game,
          createdBy: room.created_by,
          createdAt: room.created_at,
          players: room.players || [],
          maxPlayers: room.max_players,
        }));

        setRooms(transformedRooms);
      } else {
        setRooms([]);
      }
    } catch (err) {
      console.error("Error fetching game rooms:", err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from("game_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data) {
        const transformedMessages: GameMessage[] = data.map((msg) => ({
          id: msg.id,
          roomId: msg.room_id,
          content: msg.content,
          sender: msg.sender,
          createdAt: msg.created_at,
        }));

        setMessages((prev) => ({
          ...prev,
          [roomId]: transformedMessages,
        }));
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const createGameRoomsTables = async () => {
    try {
      // Create game_rooms table
      await supabase.rpc("create_game_rooms_table");

      // Create game_messages table
      await supabase.rpc("create_game_messages_table");
    } catch (err) {
      console.error("Error creating game tables:", err);
    }
  };

  const createRoom = async () => {
    if (!user || !newRoom.name) return;

    try {
      const room = {
        name: newRoom.name,
        game: newRoom.game,
        created_by: user.displayName,
        players: [user.displayName],
        max_players: newRoom.maxPlayers,
      };

      const { data, error } = await supabase
        .from("game_rooms")
        .insert([room])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        // Reset form
        setNewRoom({
          name: "",
          game: "Math Challenge",
          maxPlayers: 4,
        });
        setIsCreateRoomOpen(false);

        // Select the new room
        const newRoomData: GameRoom = {
          id: data[0].id,
          name: data[0].name,
          game: data[0].game,
          createdBy: data[0].created_by,
          createdAt: data[0].created_at,
          players: data[0].players || [],
          maxPlayers: data[0].max_players,
        };

        setSelectedRoom(newRoomData);
        fetchMessages(newRoomData.id);
      }
    } catch (err) {
      console.error("Error creating room:", err);
    }
  };

  const joinRoom = async (room: GameRoom) => {
    if (!user) return;

    try {
      // Check if user is already in the room
      if (room.players.includes(user.displayName)) {
        setSelectedRoom(room);
        fetchMessages(room.id);
        return;
      }

      // Check if room is full
      if (room.players.length >= room.maxPlayers) {
        alert("This room is full");
        return;
      }

      // Add user to players array
      const updatedPlayers = [...room.players, user.displayName];

      const { error } = await supabase
        .from("game_rooms")
        .update({ players: updatedPlayers })
        .eq("id", room.id);

      if (error) throw error;

      // Update local state
      const updatedRoom = { ...room, players: updatedPlayers };
      setSelectedRoom(updatedRoom);
      fetchMessages(room.id);

      // Send a join message
      sendSystemMessage(`${user.displayName} joined the room`, room.id);
    } catch (err) {
      console.error("Error joining room:", err);
    }
  };

  const leaveRoom = async () => {
    if (!user || !selectedRoom) return;

    try {
      // Remove user from players array
      const updatedPlayers = selectedRoom.players.filter(
        (player) => player !== user.displayName,
      );

      if (updatedPlayers.length === 0) {
        // If no players left, delete the room
        const { error } = await supabase
          .from("game_rooms")
          .delete()
          .eq("id", selectedRoom.id);

        if (error) throw error;
      } else {
        // Update the room with remaining players
        const { error } = await supabase
          .from("game_rooms")
          .update({ players: updatedPlayers })
          .eq("id", selectedRoom.id);

        if (error) throw error;

        // Send a leave message
        sendSystemMessage(`${user.displayName} left the room`, selectedRoom.id);
      }

      // Clear selected room
      setSelectedRoom(null);
    } catch (err) {
      console.error("Error leaving room:", err);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedRoom || !newMessage.trim()) return;

    try {
      const message = {
        room_id: selectedRoom.id,
        content: newMessage,
        sender: user.displayName,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("game_messages").insert([message]);

      if (error) throw error;

      // Clear input
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const sendSystemMessage = async (content: string, roomId: string) => {
    try {
      const message = {
        room_id: roomId,
        content: content,
        sender: "System",
        created_at: new Date().toISOString(),
      };

      await supabase.from("game_messages").insert([message]);
    } catch (err) {
      console.error("Error sending system message:", err);
    }
  };

  return (
    <DashboardLayout activeTab="gaming">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gaming Zone</h1>
            <p className="text-muted-foreground">
              Play educational games with your classmates in real-time.
            </p>
          </div>

          {!selectedRoom && (
            <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create Game Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Game Room</DialogTitle>
                  <DialogDescription>
                    Create a room to play games with your classmates.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomName">Room Name</Label>
                    <Input
                      id="roomName"
                      placeholder="Enter room name"
                      value={newRoom.name}
                      onChange={(e) =>
                        setNewRoom({ ...newRoom, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gameType">Game Name (Optional)</Label>
                    <Input
                      id="gameType"
                      placeholder="Enter game name"
                      value={newRoom.game}
                      onChange={(e) =>
                        setNewRoom({ ...newRoom, game: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxPlayers">Max Students (2-40)</Label>
                    <Input
                      id="maxPlayers"
                      type="number"
                      min="2"
                      max="40"
                      value={newRoom.maxPlayers}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= 2 && value <= 40) {
                          setNewRoom({
                            ...newRoom,
                            maxPlayers: value,
                          });
                        }
                      }}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateRoomOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createRoom} disabled={!newRoom.name}>
                    Create Room
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {selectedRoom ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="md:col-span-1">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{selectedRoom.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={leaveRoom}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {selectedRoom.createdBy === user?.displayName && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={async () => {
                          if (
                            confirm(
                              "Are you sure you want to delete this room?",
                            )
                          ) {
                            try {
                              await supabase
                                .from("game_rooms")
                                .delete()
                                .eq("id", selectedRoom.id);
                              setSelectedRoom(null);
                            } catch (err) {
                              console.error("Error deleting room:", err);
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>
                  <Badge variant="outline">{selectedRoom.game}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Players ({selectedRoom.players.length}/
                    {selectedRoom.maxPlayers})
                  </h3>
                  <div className="space-y-2">
                    {selectedRoom.players.map((player, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player}`}
                          />
                          <AvatarFallback>{player[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{player}</span>
                        {player === selectedRoom.createdBy && (
                          <Badge variant="secondary" className="text-xs">
                            Host
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <Button className="w-full" disabled>
                    <GamepadIcon className="mr-2 h-4 w-4" /> Start Game
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Game play coming soon
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="md:col-span-3 flex flex-col"
              style={{ height: "500px" }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {messages[selectedRoom.id]?.length ? (
                      messages[selectedRoom.id].map((message) => (
                        <div
                          key={message.id}
                          className="flex items-start space-x-2"
                        >
                          {message.sender !== "System" ? (
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender}`}
                              />
                              <AvatarFallback>
                                {message.sender[0]}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-8 w-8 flex items-center justify-center bg-primary/10 rounded-full">
                              <GamepadIcon className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-baseline">
                              <span className="font-medium text-sm mr-2">
                                {message.sender}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                            </div>
                            <p
                              className={
                                message.sender === "System"
                                  ? "text-sm italic text-muted-foreground"
                                  : "text-sm"
                              }
                            >
                              {message.content}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No messages yet. Start the conversation!
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="mt-4 flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs
            defaultValue="rooms"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rooms" className="flex items-center">
                <GamepadIcon className="h-4 w-4 mr-2" /> Game Rooms
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex items-center">
                <Trophy className="h-4 w-4 mr-2" /> Leaderboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rooms" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-center p-12 border rounded-lg bg-muted/20">
                  <GamepadIcon className="h-12 w-12 mx-auto text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No Game Rooms Available
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Create a room to start playing with your classmates.
                  </p>
                  <Button onClick={() => setIsCreateRoomOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Game Room
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {rooms.map((room) => (
                    <Card
                      key={room.id}
                      className="overflow-hidden hover:shadow-md transition-all"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{room.name}</CardTitle>
                          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10">
                            {getGameIcon(room.game)}
                          </div>
                        </div>
                        <CardDescription>{room.game}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm text-muted-foreground">
                            Created by {room.createdBy}
                          </div>
                          <div className="text-sm font-medium">
                            {room.players.length}/{room.maxPlayers} players
                          </div>
                        </div>

                        <div className="flex -space-x-2 mb-4">
                          {room.players.slice(0, 5).map((player, i) => (
                            <Avatar
                              key={i}
                              className="border-2 border-background h-8 w-8"
                            >
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player}`}
                              />
                              <AvatarFallback>{player[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                          {room.players.length > 5 && (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                              +{room.players.length - 5}
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full"
                          onClick={() => joinRoom(room)}
                          disabled={
                            room.players.length >= room.maxPlayers &&
                            !room.players.includes(user?.displayName || "")
                          }
                        >
                          {room.players.includes(user?.displayName || "") ? (
                            "Rejoin Room"
                          ) : room.players.length >= room.maxPlayers ? (
                            "Room Full"
                          ) : (
                            <>
                              <UserPlus className="mr-2 h-4 w-4" /> Join Room
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Class Leaderboard</CardTitle>
                  <CardDescription>
                    Top performers in educational games
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <LeaderboardItem
                      rank={1}
                      name="Alex Johnson"
                      points={1250}
                      games={42}
                    />
                    <LeaderboardItem
                      rank={2}
                      name="Sarah Williams"
                      points={1180}
                      games={38}
                    />
                    <LeaderboardItem
                      rank={3}
                      name="Michael Brown"
                      points={1050}
                      games={35}
                    />
                    <LeaderboardItem
                      rank={4}
                      name="Emily Davis"
                      points={980}
                      games={33}
                    />
                    <LeaderboardItem
                      rank={5}
                      name="David Wilson"
                      points={920}
                      games={30}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}

interface LeaderboardItemProps {
  rank: number;
  name: string;
  points: number;
  games: number;
}

const getGameIcon = (game: string) => {
  switch (game) {
    case "Math Challenge":
      return <span className="text-2xl">🧮</span>;
    case "Word Scramble":
      return <span className="text-2xl">📝</span>;
    case "Science Quiz":
      return <span className="text-2xl">🔬</span>;
    case "Geography Explorer":
      return <span className="text-2xl">🌍</span>;
    case "History Timeline":
      return <span className="text-2xl">⏳</span>;
    case "Coding Puzzles":
      return <span className="text-2xl">💻</span>;
    default:
      return <GamepadIcon className="h-6 w-6" />;
  }
};

interface LeaderboardItemProps {
  rank: number;
  name: string;
  points: number;
  games: number;
}

function LeaderboardItem({ rank, name, points, games }: LeaderboardItemProps) {
  return (
    <div className="flex items-center p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors">
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${rank === 1 ? "bg-yellow-100 text-yellow-700" : rank === 2 ? "bg-gray-100 text-gray-700" : rank === 3 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}
      >
        {rank}
      </div>
      <div className="flex-1">
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">
          {games} games played
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold">{points}</div>
        <div className="text-xs text-muted-foreground">points</div>
      </div>
    </div>
  );
}

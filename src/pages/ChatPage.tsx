import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import {
  Send,
  Image,
  Paperclip,
  X,
  Download,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import LinkParser from "@/components/LinkParser";

export default function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  const { setHasUnreadMessages } = useNotification();
  const [messages, setMessages] = useState<Message[]>([]);

  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if there's a team parameter in the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const teamId = params.get("team");

    if (teamId) {
      // Redirect to the team chat page
      window.location.href = `/team-chat/${teamId}`;
      return;
    }

    fetchMessages();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel("class_messages_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "class_messages" },
        (payload) => {
          const newMessage = payload.new as any;
          // Transform to our Message type
          const message: Message = {
            id: newMessage.id,
            content: newMessage.content,
            sender: newMessage.sender,
            timestamp: newMessage.timestamp,
            attachments: newMessage.attachment_url
              ? [
                  {
                    type: newMessage.attachment_type?.startsWith("image/")
                      ? "image"
                      : "file",
                    url: newMessage.attachment_url,
                    name: newMessage.attachment_name,
                    size: newMessage.attachment_size,
                  },
                ]
              : undefined,
          };
          setMessages((prev) => [...prev, message]);

          // Reset unread messages when on this page
          setHasUnreadMessages(false);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [location]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("class_messages")
        .select("*")
        .order("timestamp", { ascending: true });

      if (error) throw error;

      if (data) {
        // Transform to our Message type
        const transformedMessages: Message[] = data.map((msg) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp,
          attachments: msg.attachment_url
            ? [
                {
                  type: msg.attachment_type?.startsWith("image/")
                    ? "image"
                    : "file",
                  url: msg.attachment_url,
                  name: msg.attachment_name,
                  size: msg.attachment_size,
                },
              ]
            : undefined,
        }));

        setMessages(transformedMessages);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileUpload = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!user) return;

    let files: FileList | null = null;

    // Handle both file input change and clipboard paste
    if ("clipboardData" in e) {
      // This is a clipboard event
      const clipboardData = e.clipboardData;
      if (clipboardData.files.length > 0) {
        files = clipboardData.files;
        e.preventDefault(); // Prevent pasting the file as text
      } else {
        // No files in clipboard, let the default paste behavior happen
        return;
      }
    } else if ("target" in e && e.target instanceof HTMLInputElement) {
      // This is a file input change event
      files = e.target.files;
    }

    if (!files || files.length === 0) return;

    // Add files to selectedFiles array (max 10)
    const newFiles = Array.from(files);
    const combinedFiles = [...selectedFiles, ...newFiles].slice(0, 10);
    setSelectedFiles(combinedFiles);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !user) return;

    try {
      // Upload files if any
      const attachments = [];

      for (const file of selectedFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Determine bucket based on file type
        const bucket = file.type.startsWith("image/")
          ? "chat_images"
          : "chat_files";

        // Upload file
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        attachments.push({
          url: urlData.publicUrl,
          type: file.type,
          name: file.name,
          size: file.size,
        });
      }

      // Create message content
      let content = newMessage.trim();
      if (!content && selectedFiles.length > 0) {
        content = `Sent ${selectedFiles.length} ${selectedFiles.length === 1 ? "file" : "files"}`;
      }

      // Create message object
      let messageData: any = {
        content: content,
        sender: user.displayName,
        timestamp: new Date().toISOString(),
      };

      // Add attachments if any
      if (attachments.length > 0) {
        const firstAttachment = attachments[0];
        messageData.attachment_url = firstAttachment.url;
        messageData.attachment_type = firstAttachment.type;
        messageData.attachment_name = firstAttachment.name;
        messageData.attachment_size = firstAttachment.size;

        // For multiple attachments, we'll need to create additional messages
        for (let i = 1; i < attachments.length; i++) {
          const attachment = attachments[i];
          await supabase.from("class_messages").insert([
            {
              content: `Additional attachment`,
              sender: user.displayName,
              timestamp: new Date().toISOString(),
              attachment_url: attachment.url,
              attachment_type: attachment.type,
              attachment_name: attachment.name,
              attachment_size: attachment.size,
            },
          ]);
        }
      }

      // Insert message into Supabase
      const { error } = await supabase
        .from("class_messages")
        .insert([messageData]);

      if (error) {
        console.error("Error sending message:", error);
        // Add message locally if database insert fails
        const tempMessage: Message = {
          id: Date.now().toString(),
          content: content,
          sender: user.displayName,
          timestamp: new Date().toISOString(),
        };
        setMessages([...messages, tempMessage]);
      }

      // Clear input and selected files regardless of success/failure
      setNewMessage("");
      setSelectedFiles([]);
    } catch (err) {
      console.error("Error sending message:", err);
      // Add message locally if error occurs
      const tempMessage: Message = {
        id: Date.now().toString(),
        content: newMessage.trim() || "Sent files",
        sender: user.displayName,
        timestamp: new Date().toISOString(),
      };
      setMessages([...messages, tempMessage]);
      setNewMessage("");
      setSelectedFiles([]);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const getRandomColor = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];

    // Simple hash function to get consistent color for the same name
    const hash = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  messages.forEach((message) => {
    const date = formatDate(message.timestamp);
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <DashboardLayout activeTab="chat">
      <div className="space-y-6 h-[calc(100vh-10rem)]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Chat</h1>
          <p className="text-muted-foreground">
            Communicate with your classmates in real-time.
          </p>
        </div>

        <Card className="flex flex-col h-[calc(100vh-16rem)]">
          <CardHeader className="pb-2">
            <CardTitle>Class Discussion</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date} className="mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      {date}
                    </div>
                  </div>

                  {dateMessages.map((message) => {
                    const isCurrentUser =
                      user && message.sender === user.displayName;

                    return (
                      <div
                        key={message.id}
                        className={`flex mb-4 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} max-w-[80%]`}
                        >
                          {!isCurrentUser && (
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender}`}
                              />
                              <AvatarFallback
                                className={getRandomColor(message.sender)}
                              >
                                {getInitials(message.sender)}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {message.sender}
                            </div>

                            <div
                              className={`rounded-lg px-3 py-2 ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                            >
                              <div>
                                <LinkParser text={message.content} />
                              </div>

                              {message.attachments &&
                                message.attachments.length > 0 && (
                                  <div className="mt-2">
                                    {message.attachments.map(
                                      (attachment, index) =>
                                        attachment.type === "image" ? (
                                          <div
                                            key={index}
                                            className="relative group"
                                          >
                                            <img
                                              src={attachment.url}
                                              alt={attachment.name || "Image"}
                                              className="max-w-full rounded-md max-h-60 object-contain cursor-pointer"
                                              onClick={() =>
                                                setImagePreview(attachment.url)
                                              }
                                            />
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 bg-black/50 text-white hover:bg-black/70 rounded-full"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  window.open(
                                                    attachment.url,
                                                    "_blank",
                                                  );
                                                }}
                                              >
                                                <Maximize2 className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 bg-black/50 text-white hover:bg-black/70 rounded-full"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const a =
                                                    document.createElement("a");
                                                  a.href = attachment.url;
                                                  a.download =
                                                    attachment.name || "image";
                                                  document.body.appendChild(a);
                                                  a.click();
                                                  document.body.removeChild(a);
                                                }}
                                              >
                                                <Download className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div
                                            key={index}
                                            className={`text-xs flex items-center justify-between p-2 rounded ${isCurrentUser ? "bg-primary-foreground/10" : "bg-background"}`}
                                          >
                                            <div className="flex items-center overflow-hidden">
                                              <Paperclip className="h-3 w-3 mr-1 flex-shrink-0" />
                                              <span className="truncate">
                                                {attachment.name}
                                              </span>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 ml-1 flex-shrink-0"
                                              onClick={() =>
                                                window.open(
                                                  attachment.url,
                                                  "_blank",
                                                )
                                              }
                                            >
                                              <Download className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ),
                                    )}
                                  </div>
                                )}
                            </div>

                            <div
                              className={`text-xs text-muted-foreground mt-1 ${isCurrentUser ? "text-right" : "text-left"}`}
                            >
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>
          {selectedFiles.length > 0 && (
            <div className="px-4 py-2 border-t">
              <div className="flex flex-wrap gap-2 bg-muted p-2 rounded">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-background p-2 rounded"
                  >
                    <div className="flex items-center">
                      <Paperclip className="h-4 w-4 mr-2" />
                      <span className="text-sm truncate max-w-[150px]">
                        {file.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2"
                      onClick={() =>
                        setSelectedFiles(
                          selectedFiles.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {selectedFiles.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFiles([])}
                    className="ml-auto"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          )}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="hidden"
                multiple
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <Image className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Type your message... (Paste images with Ctrl+V)"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSendMessage()
                }
                onPaste={handleFileUpload}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() && selectedFiles.length === 0}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image Preview Dialog */}
          <Dialog
            open={!!imagePreview}
            onOpenChange={(open) => !open && setImagePreview(null)}
          >
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <div className="absolute top-2 right-2 z-10 flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-black/50 text-white hover:bg-black/70"
                    onClick={() => setImagePreview(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-black/50 text-white hover:bg-black/70"
                    onClick={() => window.open(imagePreview, "_blank")}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-black/50 text-white hover:bg-black/70"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = imagePreview!;
                      a.download = "image";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <img
                  src={imagePreview || ""}
                  alt="Preview"
                  className="max-h-[80vh] max-w-full object-contain mx-auto"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </DashboardLayout>
  );
}

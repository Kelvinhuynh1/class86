import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { Send, Image, Paperclip, X } from "lucide-react";
import { User } from "@/types";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  created_at: string;
  read: boolean;
}

interface DirectChatProps {
  recipientId: string;
}

export default function DirectChat({ recipientId }: DirectChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipient, setRecipient] = useState<User | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch recipient details
    const fetchRecipient = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", recipientId)
          .single();

        if (error) throw error;

        setRecipient({
          id: data.id,
          displayName: data.display_name,
          role: data.role,
          classCode: data.class_code,
          password: data.password,
        });
      } catch (err) {
        console.error("Error fetching recipient:", err);
      }
    };

    fetchRecipient();
    fetchMessages();

    // Set up real-time subscription
    const subscription = supabase
      .channel("direct_messages_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add if it's relevant to this chat
          if (
            (newMessage.sender_id === user.id &&
              newMessage.recipient_id === recipientId) ||
            (newMessage.sender_id === recipientId &&
              newMessage.recipient_id === user.id)
          ) {
            setMessages((prev) => [...prev, newMessage]);

            // Mark message as read if it's from the recipient
            if (
              newMessage.sender_id === recipientId &&
              newMessage.recipient_id === user.id
            ) {
              supabase
                .from("direct_messages")
                .update({ read: true })
                .eq("id", newMessage.id);

              // Update notification badge in real-time
              const audio = new Audio("/notification.mp3");
              audio.play().catch((e) => console.log("Audio play failed:", e));
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch messages between current user and recipient
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .or(`sender_id.eq.${recipientId},recipient_id.eq.${recipientId}`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Filter to only include messages between these two users
      const filteredMessages = data.filter(
        (msg) =>
          (msg.sender_id === user.id && msg.recipient_id === recipientId) ||
          (msg.sender_id === recipientId && msg.recipient_id === user.id),
      );

      setMessages(filteredMessages);

      // Mark messages as read
      const unreadMessages = filteredMessages
        .filter((msg) => msg.recipient_id === user.id && !msg.read)
        .map((msg) => msg.id);

      if (unreadMessages.length > 0) {
        await supabase
          .from("direct_messages")
          .update({ read: true })
          .in("id", unreadMessages);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !user) return;

    setSending(true);
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
        });
      }

      // Create message content
      let content = newMessage.trim();
      if (!content && selectedFiles.length > 0) {
        content = `Sent ${selectedFiles.length} ${selectedFiles.length === 1 ? "file" : "files"}`;
      }

      // Insert first message with first attachment if any
      if (attachments.length > 0) {
        const firstAttachment = attachments[0];

        const { data, error } = await supabase
          .from("direct_messages")
          .insert([
            {
              sender_id: user.id,
              recipient_id: recipientId,
              content: content,
              attachment_url: firstAttachment.url,
              attachment_type: firstAttachment.type,
              attachment_name: firstAttachment.name,
              read: false,
            },
          ])
          .select();

        if (error) throw error;

        // For multiple attachments, create additional messages
        for (let i = 1; i < attachments.length; i++) {
          const attachment = attachments[i];
          await supabase.from("direct_messages").insert([
            {
              sender_id: user.id,
              recipient_id: recipientId,
              content: `Additional attachment`,
              attachment_url: attachment.url,
              attachment_type: attachment.type,
              attachment_name: attachment.name,
              read: false,
            },
          ]);
        }
      } else {
        // Just send a text message
        const { data, error } = await supabase
          .from("direct_messages")
          .insert([
            {
              sender_id: user.id,
              recipient_id: recipientId,
              content: content,
              read: false,
            },
          ])
          .select();

        if (error) throw error;
      }

      // Clear input and selected files
      setNewMessage("");
      setSelectedFiles([]);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
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
    setSelectedFile(null); // Clear the single file selection since we're using multiple now
  };

  const triggerFileInput = (type: "image" | "file") => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === "image" ? "image/*" : "*/*";
      fileInputRef.current.click();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
      {/* Chat header */}
      <div className="p-4 border-b flex items-center">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${recipient?.displayName || "user"}`}
          />
          <AvatarFallback>
            {recipient ? getInitials(recipient.displayName) : "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">
            {recipient?.displayName || "Loading..."}
          </h3>
          <p className="text-xs text-muted-foreground">
            {recipient?.role || ""}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = user && message.sender_id === user.id;

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
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${recipient?.displayName || "user"}`}
                      />
                      <AvatarFallback>
                        {recipient ? getInitials(recipient.displayName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div>
                    <div
                      className={`rounded-lg px-3 py-2 ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      <div>{message.content}</div>

                      {message.attachment_url && (
                        <div className="mt-2">
                          {message.attachment_type?.startsWith("image/") ? (
                            <div className="relative group">
                              <img
                                src={message.attachment_url}
                                alt="Attachment"
                                className="max-w-full rounded-md max-h-60 object-contain cursor-pointer"
                                onClick={() =>
                                  window.open(message.attachment_url, "_blank")
                                }
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  const menu = document.createElement("div");
                                  menu.className =
                                    "absolute z-50 bg-white shadow-lg rounded-md p-2";
                                  menu.style.left = `${e.clientX}px`;
                                  menu.style.top = `${e.clientY}px`;
                                  menu.innerHTML = `
                                    <div class="p-2 hover:bg-gray-100 cursor-pointer" onclick="window.open('${message.attachment_url}', '_blank')">Open in new tab</div>
                                    <div class="p-2 hover:bg-gray-100 cursor-pointer" onclick="navigator.clipboard.writeText('${message.attachment_url}')">Copy image URL</div>
                                    <a class="block p-2 hover:bg-gray-100 cursor-pointer" href="${message.attachment_url}" download="${message.attachment_name || "image"}">Save image as...</a>
                                  `;
                                  document.body.appendChild(menu);

                                  const removeMenu = () => {
                                    if (document.body.contains(menu)) {
                                      document.body.removeChild(menu);
                                    }
                                    document.removeEventListener(
                                      "click",
                                      removeMenu,
                                    );
                                  };

                                  setTimeout(() => {
                                    document.addEventListener(
                                      "click",
                                      removeMenu,
                                    );
                                  }, 100);
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-md">
                                <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                                  Click to view • Right-click for options
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center p-2 rounded bg-background/50">
                              <Paperclip className="h-4 w-4 mr-2" />
                              <span className="text-sm truncate">
                                {message.attachment_name}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-2"
                                onClick={() =>
                                  window.open(message.attachment_url, "_blank")
                                }
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      className={`text-xs text-muted-foreground mt-1 ${isCurrentUser ? "text-right" : "text-left"}`}
                    >
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Files preview */}
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

      {/* Input area */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => triggerFileInput("file")}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => triggerFileInput("image")}
          >
            <Image className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Type your message... (Paste images with Ctrl+V)"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            onPaste={(e) => handleFileSelect(e)}
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={
              (!newMessage.trim() && selectedFiles.length === 0) || sending
            }
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface Download {
  className: string;
}

function Download({ className }: Download) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

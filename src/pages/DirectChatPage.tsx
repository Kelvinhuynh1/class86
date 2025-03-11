import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ChatUserList from "@/components/chat/ChatUserList";
import DirectChat from "@/components/chat/DirectChat";

export default function DirectChatPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <DashboardLayout activeTab="direct-chat">
      <div className="space-y-6 h-[calc(100vh-10rem)]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Direct Messages</h1>
          <p className="text-muted-foreground">
            Send private messages to classmates and teachers.
          </p>
        </div>

        <div className="border rounded-md h-[calc(100vh-16rem)] overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={25} minSize={20}>
              <ChatUserList
                onSelectUser={setSelectedUserId}
                selectedUserId={selectedUserId}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={75}>
              {selectedUserId ? (
                <DirectChat recipientId={selectedUserId} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a user to start chatting
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </DashboardLayout>
  );
}

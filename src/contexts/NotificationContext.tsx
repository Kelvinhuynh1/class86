import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

type NotificationContextType = {
  playNotification: () => void;
  hasUnreadMessages: boolean;
  setHasUnreadMessages: (value: boolean) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );

  useEffect(() => {
    // Initialize audio element
    const audio = new Audio("/notification.mp3");
    setAudioElement(audio);

    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Reset unread messages when navigating to relevant pages
    const path = location.pathname;
    if (
      path.includes("/chat") ||
      path.includes("/team-chat") ||
      path.includes("/direct-chat") ||
      path.includes("/posts") ||
      path.includes("/gaming")
    ) {
      setHasUnreadMessages(false);
    }

    // Set up subscriptions for different message types
    const setupSubscriptions = () => {
      // Class chat messages
      const classChatSubscription = supabase
        .channel("class_chat_notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "class_messages" },
          (payload) => {
            if (!path.includes("/chat")) {
              setHasUnreadMessages(true);
              playNotification();
            }
          },
        )
        .subscribe();

      // Team messages
      const teamChatSubscription = supabase
        .channel("team_chat_notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "team_messages" },
          (payload) => {
            const currentTeamId = path.split("/team-chat/")[1];
            if (
              !path.includes("/team-chat") ||
              (currentTeamId && currentTeamId !== payload.new.team_id)
            ) {
              setHasUnreadMessages(true);
              playNotification();
            }
          },
        )
        .subscribe();

      // Direct messages
      const directChatSubscription = supabase
        .channel("direct_chat_notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "direct_messages" },
          (payload) => {
            if (
              payload.new.recipient_id === user.id &&
              !path.includes("/direct-chat")
            ) {
              setHasUnreadMessages(true);
              playNotification();
            }
          },
        )
        .subscribe();

      // Post comments
      const postCommentsSubscription = supabase
        .channel("post_comments_notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "post_comments" },
          () => {
            if (!path.includes("/posts")) {
              setHasUnreadMessages(true);
              playNotification();
            }
          },
        )
        .subscribe();

      // Game messages
      const gameMessagesSubscription = supabase
        .channel("game_messages_notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "game_messages" },
          () => {
            if (!path.includes("/gaming")) {
              setHasUnreadMessages(true);
              playNotification();
            }
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(classChatSubscription);
        supabase.removeChannel(teamChatSubscription);
        supabase.removeChannel(directChatSubscription);
        supabase.removeChannel(postCommentsSubscription);
        supabase.removeChannel(gameMessagesSubscription);
      };
    };

    const cleanup = setupSubscriptions();
    return cleanup;
  }, [user, location.pathname]);

  const playNotification = () => {
    if (audioElement) {
      audioElement.currentTime = 0;
      audioElement
        .play()
        .catch((err) =>
          console.error("Failed to play notification sound:", err),
        );
    }
  };

  return (
    <NotificationContext.Provider
      value={{ playNotification, hasUnreadMessages, setHasUnreadMessages }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};

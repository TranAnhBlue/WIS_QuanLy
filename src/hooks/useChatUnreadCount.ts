import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = "http://localhost:5000";

export function useChatUnreadCount() {
  const { session } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.token) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/chat/conversations`, {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });
        
        const data = await response.json();
        
        if (data.success && data.conversations) {
          // Calculate total unread from all conversations
          const total = data.conversations.reduce(
            (sum: number, conv: any) => sum + (conv.unreadCount || 0),
            0
          );
          setUnreadCount(total);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchUnreadCount();

    // Poll every 10 seconds for updates
    const interval = setInterval(fetchUnreadCount, 10000);

    return () => clearInterval(interval);
  }, [session?.token]);

  return { unreadCount, loading };
}

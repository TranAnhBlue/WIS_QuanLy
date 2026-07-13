import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Send, ArrowLeft, Users, Plus, Search,
  MoreVertical, Check, CheckCheck, Paperclip, Smile, UserPlus, X, Download, FileText, Image
} from "lucide-react";
import { message as antdMessage } from "antd";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  company: string;
  department: string;
}

interface Conversation {
  _id: string;
  type: "direct" | "group";
  name?: string;
  description?: string;
  avatar?: string;
  participants: User[];
  otherParticipant?: User;
  admin?: User;
  lastMessage?: {
    content: string;
    sender: User;
    timestamp: string;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  conversation: string;
  sender: User;
  content: string;
  type: "text" | "system" | "image" | "file";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  readBy: Array<{ user: string; readAt: string }>;
  reactions?: Array<{
    user: {
      _id: string;
      name: string;
      avatar?: string;
    };
    emoji: string;
    createdAt: string;
  }>;
  replyTo?: Message | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

function ChatPage() {
  const navigate = useNavigate();
  const { session, user, isLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "direct" | "group">("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New chat dialogs
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Image viewer modal
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState("");
  const [viewingImageName, setViewingImageName] = useState("");

  // Emoji reactions
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null); // Track which message reactions picker is open for

  const API_BASE = "http://localhost:5000";
  const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  const EMOJI_LIST = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
    '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩',
    '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵',
    '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫',
    '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮',
    '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮',
    '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍', '👎', '👏', '🙌',
    '🤝', '🙏', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  ];

  // Load conversations - wait for auth to finish loading
  useEffect(() => {
    // Don't load if still loading auth or no session
    if (isLoading) {
      console.log('⏳ [Chat] Waiting for auth to load...');
      return;
    }
    
    if (!session?.token) {
      console.log('⚠️ [Chat] No session found, redirecting to login...');
      navigate({ to: '/login' });
      return;
    }

    console.log('✅ [Chat] Auth loaded, starting conversation load...');
    loadConversations();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [isLoading, session?.token]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv._id);
      // Mark as read
      markAsRead(selectedConv._id);
    }
  }, [selectedConv]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close emoji picker and reactions picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showEmojiPicker && !target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
      if (showReactionsFor && !target.closest('.reactions-picker-container')) {
        setShowReactionsFor(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, showReactionsFor]);

  const loadConversations = async () => {
    try {
      // Skip if no token (e.g., after logout)
      if (!session?.token) {
        console.log('⚠️ [Chat] No token available, skipping conversation load');
        return;
      }

      console.log('🔍 [Chat] Loading conversations...', {
        apiBase: API_BASE,
        hasToken: !!session?.token,
        url: `${API_BASE}/api/chat/conversations`
      });
      
      const response = await fetch(`${API_BASE}/api/chat/conversations`, {
        headers: {
          Authorization: `Bearer ${session?.token}`,
        },
      });
      
      console.log('📡 [Chat] Response status:', response.status);
      
      // Handle 401 Unauthorized - token expired
      if (response.status === 401) {
        console.error('❌ [Chat] Token expired or invalid');
        antdMessage.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate({ to: '/login' });
        }, 2000);
        return;
      }
      
      const data = await response.json();
      console.log('📦 [Chat] Response data:', {
        success: data.success,
        count: data.conversations?.length,
        conversations: data.conversations
      });
      
      if (data.success) {
        setConversations(data.conversations);
        console.log('✅ [Chat] Loaded', data.conversations.length, 'conversations');
      } else {
        console.error('❌ [Chat] API error:', data.message);
        antdMessage.error(data.message || 'Không thể tải conversations');
      }
    } catch (error) {
      console.error("❌ [Chat] Error loading conversations:", error);
      antdMessage.error('Lỗi kết nối! Kiểm tra backend server (port 5000)');
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/api/chat/conversations/${conversationId}/messages?limit=100`,
        {
          headers: {
            Authorization: `Bearer ${session?.token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() && !selectedFile) return;
    if (!selectedConv) return;

    try {
      setUploading(true);

      // Use FormData for file upload
      const formData = new FormData();
      
      if (selectedFile) {
        formData.append('file', selectedFile);
        formData.append('type', selectedFile.type.startsWith('image/') ? 'image' : 'file');
      } else {
        formData.append('content', messageInput.trim());
        formData.append('type', 'text');
      }

      const response = await fetch(
        `${API_BASE}/api/chat/conversations/${selectedConv._id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.token}`,
            // Don't set Content-Type - browser will set it with boundary for FormData
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        setMessages([...messages, data.message]);
        setMessageInput("");
        setSelectedFile(null);
        loadConversations(); // Update last message
      } else {
        antdMessage.error(data.message || "Không thể gửi tin nhắn");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      antdMessage.error("Lỗi khi gửi tin nhắn");
    } finally {
      setUploading(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(
        `${API_BASE}/api/chat/conversations/${conversationId}/read`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );
      loadConversations(); // Update unread count
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.type === "group") {
      return conv.name || "Nhóm";
    }
    return conv.otherParticipant?.name || "User";
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === "group") {
      return conv.avatar;
    }
    return conv.otherParticipant?.avatar;
  };

  // Render last message with icon for files/images
  const renderLastMessage = (conv: Conversation) => {
    if (!conv.lastMessage) return null;
    
    const isMyMessage = conv.lastMessage.sender._id === user?.id;
    const prefix = isMyMessage ? "Bạn: " : "";
    const content = conv.lastMessage.content;
    
    // Check if message is about image/file (backend sets these formats)
    if (content.includes("đã gửi hình ảnh")) {
      return (
        <span className="flex items-center gap-1">
          {prefix}
          <Image className="h-3.5 w-3.5 inline" />
          Hình ảnh
        </span>
      );
    }
    
    if (content.includes("đã gửi file")) {
      return (
        <span className="flex items-center gap-1">
          {prefix}
          <FileText className="h-3.5 w-3.5 inline" />
          File
        </span>
      );
    }
    
    // Normal text message
    return `${prefix}${content}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Hôm qua";
    } else if (days < 7) {
      return `${days} ngày trước`;
    } else {
      return date.toLocaleDateString("vi-VN");
    }
  };

  const isMyMessage = (msg: Message) => {
    return msg.sender._id === user?.id;
  };

  const isMessageRead = (msg: Message) => {
    // Check if message is read by anyone other than sender
    return msg.readBy.some((r) => r.user !== msg.sender._id);
  };

  const filteredConversations = conversations.filter((conv) => {
    const name = getConversationName(conv).toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase());
    
    // Filter by type
    if (filterType === "direct" && conv.type !== "direct") return false;
    if (filterType === "group" && conv.type !== "group") return false;
    
    return matchesSearch;
  });

  // Load all users for creating new chats
  const loadAllUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`, {
        headers: {
          Authorization: `Bearer ${session?.token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        // Filter out current user
        setAllUsers(data.users.filter((u: User) => u._id !== user?.id));
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const openNewChatDialog = () => {
    loadAllUsers();
    setNewChatDialogOpen(true);
  };

  const openNewGroupDialog = () => {
    loadAllUsers();
    setSelectedUsers([]);
    setGroupName("");
    setGroupDescription("");
    setNewGroupDialogOpen(true);
  };

  const startDirectChat = async (otherUserId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/chat/conversations/direct`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otherUserId }),
      });

      const data = await response.json();
      if (data.success) {
        setNewChatDialogOpen(false);
        await loadConversations();
        setSelectedConv(data.conversation);
      } else {
        antdMessage.error(data.message || "Không thể tạo cuộc trò chuyện");
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      antdMessage.error("Lỗi khi tạo cuộc trò chuyện");
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      antdMessage.error("Vui lòng nhập tên nhóm");
      return;
    }

    if (selectedUsers.length === 0) {
      antdMessage.error("Vui lòng chọn ít nhất 1 thành viên");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/chat/conversations/group`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim(),
          participantIds: selectedUsers,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewGroupDialogOpen(false);
        setGroupName("");
        setGroupDescription("");
        setSelectedUsers([]);
        await loadConversations();
        setSelectedConv(data.conversation);
      } else {
        antdMessage.error(data.message || "Không thể tạo nhóm");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      antdMessage.error("Lỗi khi tạo nhóm");
    }
  };

  // Open image viewer
  const openImageViewer = (imageUrl: string, imageName: string) => {
    setViewingImageUrl(imageUrl);
    setViewingImageName(imageName);
    setImageViewerOpen(true);
  };

  // Toggle reaction on message
  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/chat/messages/${messageId}/react`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ emoji }),
        }
      );

      const data = await response.json();
      if (data.success) {
        // Update message in state
        setMessages(messages.map(msg => 
          msg._id === messageId ? data.message : msg
        ));
        // Close reactions picker after reacting
        setShowReactionsFor(null);
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  // Insert emoji into message input
  const insertEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Group reactions by emoji
  const groupReactions = (reactions?: Message['reactions']) => {
    if (!reactions || reactions.length === 0) return [];
    
    const grouped = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction.user);
      return acc;
    }, {} as Record<string, Array<{ _id: string; name: string; avatar?: string }>>);

    return Object.entries(grouped).map(([emoji, users]) => ({
      emoji,
      users,
      count: users.length,
      hasMyReaction: users.some(u => u._id === user?.id),
    }));
  };

  // Get reaction tooltip text
  const getReactionTooltip = (users: Array<{ _id: string; name: string }>) => {
    const myReaction = users.find(u => u._id === user?.id);
    const others = users.filter(u => u._id !== user?.id);
    
    if (users.length === 1) {
      return myReaction ? 'Bạn' : users[0].name;
    }
    
    if (myReaction && others.length === 1) {
      return `Bạn và ${others[0].name}`;
    }
    
    if (myReaction) {
      return `Bạn và ${others.length} người khác`;
    }
    
    if (users.length === 2) {
      return `${users[0].name} và ${users[1].name}`;
    }
    
    return `${users[0].name} và ${users.length - 1} người khác`;
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = allUsers.filter((u) =>
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session?.token) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate({ to: "/" })}
                className="p-2 hover:bg-accent rounded-md transition-colors"
                title="Quay lại Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Tin nhắn
              </h2>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={openNewChatDialog} 
                title="Tạo chat 1-1 với đồng nghiệp"
                className="hover:bg-primary/10"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={openNewGroupDialog} 
                title="Tạo nhóm chat mới"
                className="hover:bg-primary/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex gap-1 p-1 bg-muted rounded-md">
            <button
              onClick={() => setFilterType("all")}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                filterType === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType("direct")}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                filterType === "direct"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Cá nhân
            </button>
            <button
              onClick={() => setFilterType("group")}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                filterType === "group"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Nhóm
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-medium mb-2">Chưa có cuộc trò chuyện</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Bắt đầu trò chuyện bằng cách:
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={openNewChatDialog}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Chat 1-1 với đồng nghiệp
                  </Button>
                  <Button
                    onClick={openNewGroupDialog}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Tạo nhóm chat
                  </Button>
                </div>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => setSelectedConv(conv)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                    selectedConv?._id === conv._id ? "bg-accent" : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={getConversationAvatar(conv)} />
                      <AvatarFallback>
                        {getInitials(getConversationName(conv))}
                      </AvatarFallback>
                    </Avatar>
                    {conv.type === "group" && (
                      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                        <Users className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm truncate">
                        {getConversationName(conv)}
                      </h3>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conv.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                        {renderLastMessage(conv)}
                      </p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={getConversationAvatar(selectedConv)} />
                <AvatarFallback>
                  {getInitials(getConversationName(selectedConv))}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">
                  {getConversationName(selectedConv)}
                </h2>
                {selectedConv.type === "group" ? (
                  <p className="text-sm text-muted-foreground">
                    {selectedConv.participants.length} thành viên
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {selectedConv.otherParticipant?.role}
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có tin nhắn</p>
                  <p className="text-sm">Gửi tin nhắn đầu tiên nhé!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isMine = isMyMessage(msg);
                  const isRead = isMessageRead(msg);

                  if (msg.type === "system") {
                    return (
                      <div
                        key={msg._id}
                        className="flex justify-center"
                      >
                        <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${isMine ? "flex-row-reverse" : ""}`}>
                        {!isMine && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.sender.avatar} />
                            <AvatarFallback>
                              {getInitials(msg.sender.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          onMouseEnter={() => setHoveredMessageId(msg._id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                          className="relative"
                        >
                          {!isMine && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {msg.sender.name}
                            </p>
                          )}
                          
                          {/* Quick Reactions (on hover for text/file messages) */}
                          {hoveredMessageId === msg._id && msg.type !== "image" && (
                            <div className={`absolute ${isMine ? 'right-0' : 'left-0'} -top-8 bg-background border rounded-full shadow-lg px-2 py-1 flex gap-1 z-10 animate-in fade-in slide-in-from-top-2 duration-200`}>
                              {QUICK_REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(msg._id, emoji)}
                                  className="hover:scale-125 transition-transform text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent"
                                  title={`React với ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {/* Image Message */}
                          {msg.type === "image" && msg.fileUrl && (
                            <div className="relative group">
                              <div className="rounded-2xl overflow-hidden">
                                <img
                                  src={`${API_BASE}${msg.fileUrl}`}
                                  alt={msg.fileName || "Image"}
                                  className="max-w-xs max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openImageViewer(`${API_BASE}${msg.fileUrl}`, msg.fileName || 'Image')}
                                />
                                {/* Only show content if it's different from fileName (means user added a caption) */}
                                {msg.content && msg.content !== msg.fileName && (
                                  <div className={`px-4 py-2 ${isMine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                    <p className="text-sm">{msg.content}</p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Smile Button for Image Reactions */}
                              <div className="reactions-picker-container">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowReactionsFor(showReactionsFor === msg._id ? null : msg._id);
                                  }}
                                  className={`absolute bottom-2 ${isMine ? 'right-2' : 'left-2'} bg-background/95 backdrop-blur-sm border rounded-full shadow-lg p-2 hover:scale-110 transition-transform z-10`}
                                  title="Thả cảm xúc"
                                >
                                  <Smile className="h-5 w-5 text-muted-foreground" />
                                </button>
                                
                                {/* Reactions Picker Popup */}
                                {showReactionsFor === msg._id && (
                                  <div className={`absolute bottom-12 ${isMine ? 'right-2' : 'left-2'} bg-background border rounded-full shadow-xl px-2 py-1 flex gap-1 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                                    {QUICK_REACTIONS.map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleReaction(msg._id, emoji);
                                        }}
                                        className="hover:scale-125 transition-transform text-xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent"
                                        title={`React với ${emoji}`}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* File Message */}
                          {msg.type === "file" && msg.fileUrl && (
                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded flex items-center justify-center ${
                                  isMine ? "bg-primary-foreground/20" : "bg-primary/10"
                                }`}>
                                  <FileText className={`h-5 w-5 ${isMine ? "text-primary-foreground" : "text-primary"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{msg.fileName || "File"}</p>
                                  {msg.fileSize && (
                                    <p className={`text-xs ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                      {(msg.fileSize / 1024).toFixed(1)} KB
                                    </p>
                                  )}
                                </div>
                                <a
                                  href={`${API_BASE}${msg.fileUrl}`}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 ${isMine ? "hover:bg-primary-foreground/20" : ""}`}
                                  >
                                    <Download className={`h-4 w-4 ${isMine ? "text-primary-foreground" : ""}`} />
                                  </Button>
                                </a>
                              </div>
                              {/* Only show content if it's different from fileName (means user added a caption) */}
                              {msg.content && msg.content !== msg.fileName && (
                                <p className="text-sm mt-2">{msg.content}</p>
                              )}
                            </div>
                          )}
                          
                          {/* Text Message */}
                          {msg.type === "text" && (
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                isMine
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                            </div>
                          )}
                          
                          {/* Reactions Display */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {groupReactions(msg.reactions).map((reaction) => (
                                <button
                                  key={reaction.emoji}
                                  onClick={() => toggleReaction(msg._id, reaction.emoji)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all hover:scale-110 ${
                                    reaction.hasMyReaction
                                      ? 'bg-primary/10 border-primary text-primary font-medium'
                                      : 'bg-muted border-border hover:bg-accent'
                                  }`}
                                  title={getReactionTooltip(reaction.users)}
                                >
                                  <span className="text-sm">{reaction.emoji}</span>
                                  {reaction.count > 1 && (
                                    <span className="font-medium">{reaction.count}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                          
                          <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(msg.createdAt)}
                            </span>
                            {isMine && (
                              <>
                                {isRead ? (
                                  <CheckCheck className="h-3 w-3 text-blue-500" />
                                ) : (
                                  <Check className="h-3 w-3 text-muted-foreground" />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t">
            {/* File Preview */}
            {selectedFile && (
              <div className="mb-3 p-3 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedFile.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-primary/10 rounded flex items-center justify-center">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Input Area */}
            <div className="flex items-center gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Check file size (max 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                      antdMessage.error('File quá lớn! Tối đa 10MB');
                      return;
                    }
                    setSelectedFile(file);
                    setMessageInput(''); // Clear text input when file selected
                  }
                }}
              />
              
              {/* Paperclip button - Open file dialog */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Đính kèm file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Input
                placeholder={selectedFile ? "File đã chọn..." : "Nhập tin nhắn..."}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1"
                disabled={!!selectedFile}
              />
              
              {/* Emoji Picker */}
              <div className="relative emoji-picker-container">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Chọn emoji"
                >
                  <Smile className="h-4 w-4" />
                </Button>
                
                {showEmojiPicker && (
                  <div className="absolute bottom-12 right-0 bg-background border rounded-lg shadow-xl p-3 w-80 max-h-60 overflow-y-auto z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b">
                      <p className="text-sm font-semibold">Chọn emoji</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setShowEmojiPicker(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-10 gap-1">
                      {EMOJI_LIST.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => insertEmoji(emoji)}
                          className="text-2xl hover:scale-125 transition-transform hover:bg-accent rounded p-1"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                onClick={sendMessage}
                disabled={!messageInput.trim() && !selectedFile || uploading}
                size="icon"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center max-w-md px-4">
            <MessageSquare className="h-20 w-20 mx-auto mb-6 opacity-30" />
            <h3 className="text-xl font-semibold mb-2">
              Chào mừng đến Chat nội bộ
            </h3>
            <p className="text-sm mb-6">
              Chọn một cuộc trò chuyện bên trái để bắt đầu nhắn tin, hoặc tạo mới ngay!
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={openNewChatDialog} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Chat 1-1
              </Button>
              <Button onClick={openNewGroupDialog} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Tạo nhóm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Direct Chat Dialog */}
      <Dialog open={newChatDialogOpen} onOpenChange={setNewChatDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tin nhắn mới</DialogTitle>
            <DialogDescription>
              Chọn người để bắt đầu chat 1-1
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm nhân viên..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Không tìm thấy nhân viên
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => startDirectChat(u._id)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <Avatar>
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{u.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.role} • {u.company}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* New Group Chat Dialog */}
      <Dialog open={newGroupDialogOpen} onOpenChange={setNewGroupDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Tạo nhóm mới</DialogTitle>
            <DialogDescription>
              Đặt tên và chọn thành viên cho nhóm
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Tên nhóm *</Label>
              <Input
                id="groupName"
                placeholder="VD: Line 1, Line 2, Dự án X..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="groupDescription">Mô tả (tùy chọn)</Label>
              <Input
                id="groupDescription"
                placeholder="Mô tả về nhóm..."
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
              />
            </div>

            <div>
              <Label>Thành viên ({selectedUsers.length} đã chọn)</Label>
              <div className="relative mt-2 mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm nhân viên..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="h-[250px] border rounded-lg p-2">
                <div className="space-y-2">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Không tìm thấy nhân viên
                    </div>
                  ) : (
                    filteredUsers.map((u) => (
                      <div
                        key={u._id}
                        onClick={() => toggleUserSelection(u._id)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedUsers.includes(u._id)}
                          onCheckedChange={() => toggleUserSelection(u._id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar} />
                          <AvatarFallback className="text-xs">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{u.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {u.role} • {u.department}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setNewGroupDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={createGroup} disabled={!groupName.trim() || selectedUsers.length === 0}>
              Tạo nhóm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-6xl w-full p-0 overflow-hidden bg-black/95 border-none">
          <div className="relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full"
              onClick={() => setImageViewerOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            
            {/* Download button */}
            <a
              href={viewingImageUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-16 z-10"
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full"
                title="Tải về"
              >
                <Download className="h-5 w-5" />
              </Button>
            </a>
            
            {/* Image - Full screen */}
            <div className="flex items-center justify-center min-h-[500px] max-h-[90vh]">
              <img
                src={viewingImageUrl}
                alt="Image"
                className="max-w-full max-h-[90vh] object-contain"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

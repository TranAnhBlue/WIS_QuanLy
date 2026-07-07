import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Send, ArrowLeft, Users, Plus, Search,
  MoreVertical, Check, CheckCheck, Paperclip, Smile, UserPlus, X
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
  type: "text" | "system";
  readBy: Array<{ user: string; readAt: string }>;
  replyTo?: any;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

function ChatPage() {
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "direct" | "group">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New chat dialogs
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const API_BASE = "http://localhost:5000";

  // Load conversations
  useEffect(() => {
    loadConversations();
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/chat/conversations`, {
        headers: {
          Authorization: `Bearer ${session?.token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
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
    if (!messageInput.trim() || !selectedConv) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/chat/conversations/${selectedConv._id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: messageInput.trim(),
            type: "text",
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setMessages([...messages, data.message]);
        setMessageInput("");
        loadConversations(); // Update last message
      } else {
        antdMessage.error(data.message || "Không thể gửi tin nhắn");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      antdMessage.error("Lỗi khi gửi tin nhắn");
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
        antdMessage.success("Đã tạo nhóm thành công!");
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
              <Button size="sm" variant="ghost" onClick={openNewChatDialog} title="Chat 1-1">
                <UserPlus className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={openNewGroupDialog} title="Tạo nhóm">
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
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có cuộc trò chuyện</p>
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
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage.sender._id === user?.id && "Bạn: "}
                        {conv.lastMessage.content}
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
                        <div>
                          {!isMine && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {msg.sender.name}
                            </p>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isMine
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                          </div>
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
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Nhập tin nhắn..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button variant="ghost" size="icon">
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              Chọn một cuộc trò chuyện
            </h3>
            <p>Chọn cuộc trò chuyện bên trái để bắt đầu nhắn tin</p>
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
    </div>
  );
}

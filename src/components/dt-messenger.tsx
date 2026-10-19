"use client";

import { useState, useEffect, useRef } from "react";
import { getCurrentUser, DtUser } from "@/src/lib/auth-store";
import { getConversations, getMessagesBetween, sendMessage, markMessagesRead, getAllMessages, MessageData, loadSavedMessages, AGENCIES } from "@/src/lib/njangui-data";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";

export function DtMessenger() {
  const [user, setUser] = useState<DtUser | null>(null);
  const [convs, setConvs] = useState<{ withUserId: string; packId?: string; lastMessage: MessageData }[]>([]);
  const [selectedConv, setSelectedConv] = useState<{ withUserId: string; packId?: string } | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    loadSavedMessages().then(() => {
      if (u) {
        setConvs(getConversations(u.id));
      }
    });
  }, []);

  useEffect(() => {
    if (selectedConv && user) {
      markMessagesRead(user.id, selectedConv.withUserId).then(() => {
        setMessages(getMessagesBetween(user.id, selectedConv.withUserId, selectedConv.packId));
        setConvs(getConversations(user.id));
      });
    }
  }, [selectedConv, user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSend() {
    if (!user || !input.trim() || !selectedConv) return;
    const msg: MessageData = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      receiverId: selectedConv.withUserId,
      packId: selectedConv.packId,
      text: input.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    await sendMessage(msg);
    setInput("");
    setMessages(prev => [...prev, msg]);
    setConvs(getConversations(user.id));
  }

  function getOtherUserInfo(otherId: string) {
    const agency = AGENCIES.find(a => a.id === otherId || (a as any).userId === otherId);
    if (agency) return { name: agency.name, avatar: agency.logo };
    return { name: otherId, avatar: "" };
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <MessageCircle size={48} className="mx-auto mb-3 opacity-40" />
          <p>Connectez-vous pour accéder à vos messages</p>
        </div>
      </div>
    );
  }

  const otherUser = selectedConv ? getOtherUserInfo(selectedConv.withUserId) : null;

  return (
    <div className="flex h-[calc(100vh-12rem)] border rounded-xl overflow-hidden bg-card">
      {/* Conversation list */}
      <div className={`w-full sm:w-80 border-r shrink-0 flex flex-col ${showMobileList ? "block" : "hidden sm:flex"}`}>
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convs.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Aucune conversation pour le moment.
            </div>
          ) : (
            convs.map((conv) => {
              const info = getOtherUserInfo(conv.withUserId);
              const isUnread = conv.lastMessage.receiverId === user.id && !conv.lastMessage.read;
              return (
                <button
                  key={`${conv.withUserId}_${conv.packId ?? ""}`}
                  onClick={() => { setSelectedConv({ withUserId: conv.withUserId, packId: conv.packId }); setShowMobileList(false); }}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${isUnread ? "bg-orange-50 font-bold" : ""} ${selectedConv?.withUserId === conv.withUserId ? "bg-muted" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EA580C]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#EA580C]">
                      {info.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${isUnread ? "font-bold" : ""}`}>{info.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{conv.lastMessage.text}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message thread */}
      <div className={`flex-1 flex flex-col ${showMobileList ? "hidden sm:flex" : "flex"}`}>
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 opacity-20" />
              <p>Sélectionnez une conversation</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setShowMobileList(true)}>
                <ArrowLeft size={18} />
              </Button>
              <div className="w-9 h-9 rounded-full bg-[#EA580C]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#EA580C]">
                {otherUser?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-sm">{otherUser?.name}</div>
                {selectedConv.packId && <div className="text-[10px] text-muted-foreground">À propos d'une offre</div>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const isMe = m.senderId === user.id;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe ? "bg-[#EA580C] text-white rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                      <div>{m.text}</div>
                      <div className={`text-[10px] mt-1 ${isMe ? "text-orange-200" : "text-muted-foreground"}`}>
                        {formatDate(m.createdAt)}
                        {isMe && <span className="ml-1">{m.read ? "✓✓" : "✓"}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                placeholder="Écrivez votre message..."
                className="flex-1"
              />
              <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
                <Send size={16} />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, Suspense } from "react";
import { DtNavbar, DtFooter } from "@/src/components/dt-navbar";
import { DtMessenger } from "@/src/components/dt-messenger";
import { getCurrentUser, DtUser } from "@/src/lib/auth-store";
import { loadSavedMessages, getConversations, sendMessage, MessageData } from "@/src/lib/njangui-data";
import { AGENCIES, getAllPacks } from "@/src/lib/njangui-data";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Send, ArrowLeft } from "lucide-react";
import { useLang } from "@/src/lib/lang";

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contactAgency = searchParams.get("contact");
  const contactPack = searchParams.get("pack");
  const [user, setUser] = useState<DtUser | null>(null);
  const { t } = useLang();
  const [firstMsg, setFirstMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
  }, []);

  const agency = contactAgency ? AGENCIES.find(a => a.id === contactAgency || (a as any).userId === contactAgency) : null;
  const pack = contactPack ? getAllPacks().find(p => p.id === contactPack) : null;

  async function handleFirstMessage() {
    if (!user || !contactAgency || !firstMsg.trim()) return;
    setSending(true);
    const msg: MessageData = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      receiverId: contactAgency,
      packId: contactPack ?? undefined,
      text: firstMsg.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    try {
      await sendMessage(msg);
      setSent(true);
    } catch {
      window.alert(t("message_send_error"));
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DtNavbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">{t("login_required")}</h1>
            <p className="text-muted-foreground mb-6">{t("login_required_desc")}</p>
            <Button onClick={() => router.push("/auth")}>{t("login_btn")}</Button>
          </Card>
        </div>
        <DtFooter />
      </div>
    );
  }

  if (contactAgency && agency && !sent) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DtNavbar />
        <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10">
          <Button variant="ghost" size="sm" onClick={() => router.push("/messages")} className="mb-6">
            <ArrowLeft size={16} className="mr-1" /> {t("all_conversations")}
          </Button>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-2">{t("contact_agency_msg")} {agency.name}</h2>
              {pack && <p className="text-sm text-muted-foreground mb-4">{t("about_label")} {pack.name}</p>}
              <Textarea
                placeholder={t("message_placeholder")}
                value={firstMsg}
                onChange={e => setFirstMsg(e.target.value)}
                rows={4}
                className="mb-4"
              />
              <Button
                className="bg-[#EA580C] hover:bg-[#C2410C]"
                disabled={sending || !firstMsg.trim()}
                onClick={handleFirstMessage}
              >
                <Send size={14} className="mr-2" />
                {sending ? t("sending_label") : t("send_message_btn")}
              </Button>
            </CardContent>
          </Card>
        </main>
        <DtFooter />
      </div>
    );
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DtNavbar />
        <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Send size={24} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">{t("message_sent")}</h2>
              <p className="text-muted-foreground mb-6">{t("message_sent_desc")} {agency?.name}. Ils vous répondront rapidement.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => router.push("/messages")}>
                  {t("view_conversation")}
                </Button>
                <Button className="bg-[#EA580C] hover:bg-[#C2410C]" onClick={() => router.push("/search")}>
                  {t("browse_offers")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <DtFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DtNavbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-8">
        <DtMessenger agencyId={AGENCIES.find((a) => a.userId === user.id)?.id} />
      </main>
      <DtFooter />
    </div>
  );
}

export default function MessagesPage() {
  const { t } = useLang();
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-background">
        <DtNavbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t("loading_text")}</p>
        </main>
        <DtFooter />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}

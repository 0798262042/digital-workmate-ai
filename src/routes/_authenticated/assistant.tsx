import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import {
  Conversation, ConversationContent, ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput, PromptInputTextarea, PromptInputSubmit, PromptInputFooter,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Card } from "@/components/ui/card";
import { ResponsibleAINote } from "@/components/responsible-ai-note";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant · SmartDesk AI" }] }),
  component: AssistantPage,
});

const STARTERS = [
  "Help me prepare tomorrow's presentation on Q3 sales.",
  "Write a polite follow-up to a client who hasn't replied in a week.",
  "Plan my workday: 6 tasks, working hours 08:00–17:00.",
  "Coach me through a difficult conversation with a team member.",
];

function AssistantPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const busy = status === "submitted" || status === "streaming";

  async function handleSubmit(_msg: unknown, e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    await sendMessage({ text });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary" /> AI Co-worker</h1>
        <p className="text-sm text-muted-foreground">A junior employee that never sleeps. Ask anything about your workday.</p>
      </div>

      <Card className="glass flex h-[calc(100vh-280px)] min-h-[480px] flex-col overflow-hidden p-0">
        <Conversation className="flex-1">
          <ConversationContent>
            {messages.length === 0 && (
              <div className="space-y-4 px-4 py-8">
                <p className="text-center text-sm text-muted-foreground">Try one of these to get started:</p>
                <div className="mx-auto grid max-w-2xl gap-2 sm:grid-cols-2">
                  {STARTERS.map((s) => (
                    <Button key={s} variant="outline" className="h-auto justify-start text-left text-xs whitespace-normal" onClick={() => sendMessage({ text: s })}>{s}</Button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => {
              const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              return (
                <Message key={m.id} from={m.role}>
                  <MessageContent>
                    {m.role === "assistant" ? <MessageResponse>{text}</MessageResponse> : text}
                  </MessageContent>
                </Message>
              );
            })}
            {busy && <div className="px-2 py-2"><Shimmer>Thinking…</Shimmer></div>}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="border-t p-3">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message your AI co-worker…"
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={!input.trim() || busy}><Send className="h-4 w-4" /></PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </Card>

      <ResponsibleAINote />
    </div>
  );
}

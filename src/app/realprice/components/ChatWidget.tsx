"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { AgentChat, createAgentChat } from "@21st-sdk/nextjs";
import { useChat } from "@ai-sdk/react";
import theme from "../theme.json";

const chat = createAgentChat({
  agent: "my-agent",
  tokenUrl: "/api/an-token",
});

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const {
    messages,
    handleSubmit,
    status,
    stop,
    error,
  } = useChat({ chat });

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.3)] ${
          open
            ? "bg-white/[0.06] border border-white/10 backdrop-blur-xl rotate-90"
            : "bg-[#3b82f6] hover:bg-[#2563eb] hover:scale-105"
        }`}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <X size={20} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-white" />
        )}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-6 z-[55] w-[380px] max-w-[calc(100vw-3rem)] h-[580px] max-h-[calc(100vh-8rem)] transition-all duration-500 ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="w-full h-full bg-[#0a0a0f] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
            <div>
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#3b82f6]/70">
                AI Assistant
              </p>
              <p className="text-white text-[14px] font-light">
                RealPrice Dubai
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="font-mono text-[10px] text-white/30">LIVE</span>
            </div>
          </div>

          {/* Chat */}
          <div className="h-[calc(100%-62px)]">
            <AgentChat
              messages={messages}
              onSend={() => handleSubmit()}
              status={status}
              onStop={stop}
              error={error ?? undefined}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </>
  );
}

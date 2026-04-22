"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
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

      <div
        className={`fixed bottom-24 right-6 z-[55] w-[380px] max-w-[calc(100vw-3rem)] h-[220px] transition-all duration-500 ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="w-full h-full bg-[#0a0a0f] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl p-6">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#3b82f6]/70">
            AI Assistant
          </p>
          <p className="text-white text-[14px] font-light mt-2">
            NexoProp Dubai
          </p>
          <p className="text-white/60 text-sm mt-4">
            Chat coming soon.
          </p>
        </div>
      </div>
    </>
  );
}

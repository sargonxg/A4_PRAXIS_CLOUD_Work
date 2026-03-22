"use client";

import { ChatInterface } from "@/components/assistant/chat-interface";

export default function AssistantPage() {
  return (
    <div className="-mx-6 -my-6 h-[calc(100vh-4rem)]">
      <ChatInterface />
    </div>
  );
}

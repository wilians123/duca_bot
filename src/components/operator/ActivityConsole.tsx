"use client";

import { useState } from "react";
import type { AuditEntry } from "@/lib/audit";

interface ActivityConsoleProps {
  logs: AuditEntry[];
}

function ChevronUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

export function ActivityConsole({ logs }: ActivityConsoleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const levelClass = (level: AuditEntry["level"]) => {
    switch (level) {
      case "success":
        return "log-lv-success";
      case "error":
        return "log-lv-error";
      default:
        return "log-lv-info";
    }
  };

  return (
    <div className={`console ${isOpen ? "console-open" : ""}`} aria-label="Consola de actividad">
      <button
        type="button"
        className="console-bar"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="dot" />
        <TerminalIcon />
        <span>Consola de actividad ({logs.length})</span>
        <span className="chev">
          <ChevronUp />
        </span>
      </button>

      <div className="console-log">
        {logs.map((log) => (
          <article key={log.id} className="log">
            <div className="log-top">
              <span className={levelClass(log.level)}>
                {log.level.toUpperCase()}
              </span>
              <time>{log.time}</time>
            </div>
            <p>{log.message}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

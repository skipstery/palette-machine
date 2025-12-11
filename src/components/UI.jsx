import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export const InfoBlock = ({ title, isOpen, onToggle, children, variant = "info" }) => {
  const bgColors = {
    info: "bg-blue-500 bg-opacity-10 border-blue-500 border-opacity-30",
    warning: "bg-amber-500 bg-opacity-10 border-amber-500 border-opacity-30",
    success: "bg-green-500 bg-opacity-10 border-green-500 border-opacity-30",
  };

  return (
    <div className={`rounded-lg border ${bgColors[variant] || bgColors.info}`}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <span className="font-medium text-sm">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-xs leading-relaxed space-y-3 opacity-90">
          {children}
        </div>
      )}
    </div>
  );
};

export const FormattedDescription = ({ text }) => {
  if (!text) return null;

  const paragraphs = text.split("\n\n");
  return (
    <div className="space-y-3">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split("\n");
        const hasBullets = lines.some((l) => l.trim().startsWith("•"));

        if (hasBullets) {
          return (
            <ul key={pIdx} className="space-y-1 ml-1">
              {lines.map((line, lIdx) => {
                const trimmed = line.trim();
                if (trimmed.startsWith("•")) {
                  const content = trimmed.slice(1).trim();
                  // Check for bold text (wrapped in **)
                  const boldMatch = content.match(
                    /^\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/
                  );
                  if (boldMatch) {
                    return (
                      <li key={lIdx} className="flex gap-2">
                        <span className="opacity-50">•</span>
                        <span>
                          <strong>{boldMatch[1]}</strong> — {boldMatch[2]}
                        </span>
                      </li>
                    );
                  }
                  // Check for simple bold + dash pattern without **
                  const simpleMatch = content.match(/^(\w+)\s*[—–-]\s*(.+)$/);
                  if (simpleMatch) {
                    return (
                      <li key={lIdx} className="flex gap-2">
                        <span className="opacity-50">•</span>
                        <span>
                          <strong>{simpleMatch[1]}</strong> — {simpleMatch[2]}
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key={lIdx} className="flex gap-2">
                      <span className="opacity-50">•</span>
                      <span>{content}</span>
                    </li>
                  );
                }
                return trimmed ? <p key={lIdx}>{trimmed}</p> : null;
              })}
            </ul>
          );
        }

        return <p key={pIdx}>{lines.join(" ")}</p>;
      })}
    </div>
  );
};

export const ConfigSection = ({
  title,
  description,
  isOpen,
  onToggle,
  children,
  badge,
}) => (
  <div
    className="border rounded-lg overflow-hidden"
    style={{ borderColor: "rgba(128,128,128,0.2)" }}
  >
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 flex items-center justify-between text-left"
      style={{ backgroundColor: "rgba(128,128,128,0.05)" }}
    >
      <div className="flex items-center gap-3">
        <span className="font-medium text-sm">{title}</span>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded bg-blue-500 bg-opacity-20 text-blue-400">
            {badge}
          </span>
        )}
      </div>
      {isOpen ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      )}
    </button>
    {isOpen && (
      <div className="p-4 space-y-6">
        {description && (
          <div className="text-xs opacity-70 leading-relaxed">
            {typeof description === "string" ? (
              <FormattedDescription text={description} />
            ) : (
              description
            )}
          </div>
        )}
        {children}
      </div>
    )}
  </div>
);

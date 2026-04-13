'use client';

import { useState, useRef } from 'react';
import { TEAM_MEMBERS, getTeamMember } from '@/lib/pipeline-config';

interface MentionInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function MentionInput({ value, onChange, placeholder, className }: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const cursorPos = e.target.selectionStart;
    const textBefore = newValue.slice(0, cursorPos);
    const match = textBefore.match(/@(\w*)$/);

    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setMentionStart(cursorPos - match[0].length);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (memberName: string) => {
    if (mentionQuery === null) return;
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + mentionQuery.length + 1);
    const newValue = `${before}@${memberName} ${after}`;
    onChange(newValue);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const filtered = mentionQuery !== null
    ? TEAM_MEMBERS.filter(m =>
        m.name.toLowerCase().includes(mentionQuery) ||
        m.initials.toLowerCase().includes(mentionQuery)
      )
    : [];

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
      {mentionQuery !== null && filtered.length > 0 && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] bg-white/95 backdrop-blur-xl border border-white/60 rounded-xl shadow-[0_8px_32px_-8px_rgba(28,25,22,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] py-1">
          {filtered.map(member => {
            const m = getTeamMember(member.name);
            return (
              <button
                key={member.name}
                onClick={() => insertMention(member.name)}
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-zinc-50 transition-colors"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white ${m.avatarClass}`}>
                  {m.initials}
                </div>
                <span className="text-[12px] text-[#1a1a1a]">{member.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

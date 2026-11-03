import { useState, useRef, useEffect } from "react";
import { User, X, Check } from "lucide-react";

export default function UserAutocomplete({
  users = [],
  value = "",
  onChange,
  placeholder = "Type @username or name...",
  label = "Assignee (@username)",
  allowClear = true,
  className = ""
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Selected user object
  const selectedUser = users.find((u) => u.id === value) || null;

  // Filter users based on query
  const filteredUsers = users.filter((u) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().replace(/^@/, "");
    return (
      u.username?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(user) {
    onChange(user ? user.id : "");
    setQuery("");
    setOpen(false);
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange("");
    setQuery("");
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && <label className="block text-sm font-bold text-[#1e1b18] mb-1.5">{label}</label>}

      {selectedUser ? (
        // Selected Pill State with Clear Option
        <div className="flex items-center justify-between rounded-2xl border-[1.5px] border-[#ebd9bf] bg-[#fffdfa] px-3.5 py-2.5 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#fef3c7] text-[#92400e] text-xs font-bold shrink-0">
              <User size={14} />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-xs text-[#1e1b18] truncate">
                @{selectedUser.username} <span className="font-normal text-[#8c7a65]">({selectedUser.name})</span>
              </p>
              <p className="text-[10px] font-semibold text-[#b45309]">{selectedUser.role}</p>
            </div>
          </div>
          {allowClear && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg p-1 text-[#a89580] hover:bg-[#fff7ea] hover:text-[#1e1b18] transition-colors"
              title="Clear selection"
            >
              <X size={15} />
            </button>
          )}
        </div>
      ) : (
        // Search & Type Autocomplete Input
        <div className="relative">
          <input
            type="text"
            className="field text-sm"
            placeholder={placeholder}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
          />

          {open && (
            <div className="absolute left-0 top-full z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-2xl border border-[#ebd9bf] bg-white p-1.5 shadow-xl">
              {filteredUsers.length > 0 ? (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#a89580]">
                    Suggestions ({filteredUsers.length})
                  </div>
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelect(u)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-[#fff7ea] transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#faebd7] text-[#92400e] text-xs font-bold shrink-0">
                          @
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1e1b18] truncate">
                            @{u.username} <span className="font-normal text-[#6b5847]">• {u.name}</span>
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-[#b45309]">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-3 text-center text-xs font-semibold text-[#8c7a65]">
                  No matching team members found for "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


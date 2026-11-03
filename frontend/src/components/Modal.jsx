import { X } from "lucide-react";

export default function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-[#ebd9bf] bg-white p-7 shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-[#f4e4cf] pb-4">
          <h2 className="text-xl font-bold text-[#1e1b18]">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[#a89580] hover:bg-[#fff7ea] hover:text-[#1e1b18] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

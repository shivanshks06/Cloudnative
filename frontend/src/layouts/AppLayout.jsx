import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#fcf8f2] md:flex text-[#1e1b18]">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}

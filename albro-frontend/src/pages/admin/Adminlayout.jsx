import { Outlet } from "react-router";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-black flex">
      <AdminSidebar />
      <div className="flex-1 relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)",
          }}
        />
        <div className="relative z-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
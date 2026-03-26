import Titlebar from "@/components/ui/titlebar.tsx";
import { Outlet } from "react-router";

const MainLayout = () => {
  return (
    <>
      <Titlebar />
      <main className="flex flex-col flex-1 overflow-hidden">
        <Outlet />
      </main>
    </>
  );
};

export default MainLayout;

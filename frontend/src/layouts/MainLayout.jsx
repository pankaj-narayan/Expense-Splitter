// layouts/MainLayout.jsx
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

const MainLayout = ({ setIsAuth }) => {
  return (
    <>
      <Navbar setIsAuth={setIsAuth} />
      <Outlet />
    </>
  );
};

export default MainLayout;

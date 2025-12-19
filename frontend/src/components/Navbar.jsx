import "../styles/navbar.css";
import { useNavigate } from "react-router-dom";

const Navbar = ({ setIsAuth }) => {
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  const handleLogout = () => {
  localStorage.clear();
  setIsAuth(false);              
  navigate("/");
};

  return (
    <nav className="navbar">
      <div className="navbar-left">Expense Splitter</div>

      <div className="navbar-right">
        <span className="username">{username} </span>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;

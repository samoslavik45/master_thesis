import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Nav } from 'react-bootstrap';
import './App.css';
import Profile from './Profile';
import AnotherPage from './Register';
import Login from './Login';
import MainContent from './MainContent';
import Groups from './Groups';

interface HandleLogoutButtonProps {
  setIsLoggedIn: (value: boolean) => void;
}

const HandleLogoutButton: React.FC<HandleLogoutButtonProps> = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false); 
    setTimeout(() => {
      navigate('/');
    }, 250);
  };

  return (
    <Nav.Link as="button" onClick={handleLogout}>Logout</Nav.Link>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, []);


  return (
    <Router>
      <Navbar bg="light" expand="lg" fixed="top">
        <Navbar.Brand href="/">Article searching</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ml-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
            <Nav.Link as={Link} to="/groups">Groups</Nav.Link>
            {isLoggedIn ? (
              <>
                <HandleLogoutButton setIsLoggedIn={setIsLoggedIn} />
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      

      <div className="container">
        <Routes>
          <Route path="/" element={<MainContent setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/register" element={<AnotherPage />} />
          <Route path='/groups' element={<Groups />} />
        </Routes>
      </div>
      <footer className="footer">
        <a>
          Pôvodne navrhol a vytvoril Samuel Slávik v 2024 ako bakalársku prácu na škole Univerzita Komenského v Bratislave, Fakulta matematiky, fyziky a informatiky.
        </a>
      </footer>
    </Router>
  );
}

export default App;

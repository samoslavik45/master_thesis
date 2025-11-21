import React, { useState, useEffect, createContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import MainContent from "./MainContent";
import Profile from "./Profile";
import Groups from "./Groups";

import LoginModal from "@/components/LoginModal";
import RegisterModal from "@/components/RegisterModal";
import { Toaster } from "sonner";

export const LoginContext = createContext({
  openLogin: () => {}
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  return (
    <Router>
      <LoginContext.Provider value={{ openLogin: () => setLoginOpen(true) }}>

      <Toaster
        position="bottom-right"
        richColors
        closeButton
        expand
        toastOptions={{
          style: {
            background: "hsl(35 40% 95%)",
            color: "hsl(35 25% 15%)",
            border: "1px solid hsl(35 30% 82%)",
            borderRadius: "14px",
            backdropFilter: "blur(6px)",
          },
        }}
      />
      <div className="theme-custom min-h-screen flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">

        {/* NAVBAR */}
        <header
          className="
            fixed top-0 left-0 w-full z-40
            backdrop-blur-xl
            bg-[hsl(var(--card))/0.92]
            border-b border-[hsl(var(--border))]
            shadow-[0_2px_15px_rgba(0,0,0,0.06)]
          "
        >
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

            <Link
              to="/"
              className="
                text-xl font-semibold 
                text-[hsl(var(--foreground))]
                hover:text-[hsl(var(--primary))] 
                transition-colors
              "
            >
              Article searching
            </Link>

            <nav className="hidden md:flex items-center gap-6">

              <Link
                to="/"
                className="
                  text-[hsl(var(--foreground))]
                  hover:text-[hsl(var(--primary))]
                  transition font-medium
                "
              >
                Home
              </Link>

              <Link
                to="/profile"
                className="
                  text-[hsl(var(--foreground))]
                  hover:text-[hsl(var(--primary))]
                  transition font-medium
                "
              >
                Profile
              </Link>

              <Link
                to="/groups"
                className="
                  text-[hsl(var(--foreground))]
                  hover:text-[hsl(var(--primary))]
                  transition font-medium
                "
              >
                Groups
              </Link>

              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="
                      text-[hsl(var(--foreground))]
                      hover:text-[hsl(var(--primary))]
                      transition font-medium
                    "
                  >
                    Login
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className="
                    text-[hsl(var(--foreground))]
                    hover:text-[hsl(var(--destructive))]
                    transition font-medium
                  "
                >
                  Logout
                </button>
              )}
            </nav>
          </div>
        </header>

        {/* LOGIN MODAL */}
        <LoginModal
          open={loginOpen}
          onOpenChange={setLoginOpen}
          setIsLoggedIn={setIsLoggedIn}
          openRegister={() => setRegisterOpen(true)}
        />

        {/* REGISTER MODAL */}
        <RegisterModal
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          openLogin={() => setLoginOpen(true)}
        />

        <div className="flex-grow pt-[7vh] bg-[hsl(var(--background))]">
          <Routes>
            <Route path="/" element={<MainContent setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/groups" element={<Groups />} />
          </Routes>
        </div>

        <footer
          className="
            footer
            bg-[hsl(var(--card))]
            text-[hsl(var(--foreground))]
            border-t border-[hsl(var(--border))]
            shadow-[0_-2px_12px_rgba(0,0,0,0.06)]
            py-3 text-center text-sm
          "
        >
          Pôvodne navrhol a vytvoril Samuel Slávik (2024) ako bakalársku prácu
          na UK — FMFI.
        </footer>

      </div>
      </LoginContext.Provider>
    </Router>
  );
}

export default App;

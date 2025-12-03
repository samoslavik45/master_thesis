import React, { useState, useEffect, createContext } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";

import MainContent from "./MainContent";
import Profile from "./Profile";
import Groups from "./Groups";

import LoginModal from "@/components/LoginModal";
import RegisterModal from "@/components/RegisterModal";
import { Toaster } from "sonner";

import { MoreVertical, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface CurrentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface LoginContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  openLogin: () => void;
  user: CurrentUser | null;
}

export const LoginContext = createContext<LoginContextType>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  openLogin: () => {},
  user: null,
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, []);

  // načítanie aktuálneho usera po logine
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setCurrentUser(null);
        return;
      }

      try {
        const res = await fetch("http://localhost:8000/main/current_user/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setCurrentUser(null);
          return;
        }

        const data = await res.json();
        setCurrentUser(data);
      } catch (err) {
        console.error("Failed to load current user:", err);
        setCurrentUser(null);
      }
    };

    if (isLoggedIn) {
      fetchCurrentUser();
    } else {
      setCurrentUser(null);
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setIsLoggedIn(false);
    setCurrentUser(null);
    window.location.href = "/";
  };

  return (
    <LoginContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        openLogin: () => setLoginOpen(true),
        user: currentUser,
      }}
    >
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

      <div
        className="
          theme-custom min-h-screen flex flex-col 
          bg-[hsl(var(--background))]           /* 👈 pozadie stránky */
          text-[hsl(var(--foreground))]
        "
      >
        {/* NAVBAR */}
        <header
          className="
            fixed top-0 left-0 w-full z-40
            backdrop-blur-xl
            bg-[linear-gradient(to_right,hsl(var(--card))/0.96,rgba(255,255,255,0.9))]  /* 👈 pozadie navbaru */
            border-b border-[hsl(var(--border))]
            shadow-[0_2px_18px_rgba(15,23,42,0.12)]
          "
        >
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* BRAND – full reload */}
            <button
              onClick={() => (window.location.href = "/")}
              className="
                text-lg sm:text-xl font-semibold 
                tracking-tight
                text-[hsl(var(--foreground))]
                hover:text-[hsl(var(--primary))] 
                transition-colors
              "
            >
              Article searching
            </button>

            {/* RIGHT SIDE NAV */}
            <nav className="hidden md:flex items-center gap-6">
              {/* Profile / Groups len keď je user prihlásený */}
              {isLoggedIn && (
                <>
                  <Link
                    to="/profile"
                    className="
                      text-[0.95rem]
                      text-[hsl(var(--muted-foreground))]
                      hover:text-[hsl(var(--primary))]
                      transition font-medium
                    "
                  >
                    Profile
                  </Link>

                  <Link
                    to="/groups"
                    className="
                      text-[0.95rem]
                      text-[hsl(var(--muted-foreground))]
                      hover:text-[hsl(var(--primary))]
                      transition font-medium
                    "
                  >
                    Groups
                  </Link>
                </>
              )}

              {/* Keď nie som prihlásený → len Log in */}
              {!isLoggedIn ? (
                <button
                  onClick={() => setLoginOpen(true)}
                  className="
                    ml-4 rounded-full px-4 py-1.5
                    text-[0.9rem] font-medium
                    border border-[hsl(var(--border))]
                    bg-[hsl(var(--card))]
                    text-[hsl(var(--foreground))]
                    hover:bg-[hsl(var(--primary))]
                    hover:text-[hsl(var(--primary-foreground))]
                    transition-all
                    shadow-sm hover:shadow-md
                  "
                >
                  Log in
                </button>
              ) : (
                // Keď som prihlásený → greeting + 3-bodkové menu
                <div className="ml-4 flex items-center gap-3">
                  {currentUser && (
                    <div className="flex items-center gap-3">
                      {/* Avatar / initials with glow ring */}
                      <div className="relative h-8 w-8">
                        {/* glow / ring */}
                        <div
                          className="
                            absolute inset-0
                            rounded-full
                            bg-[hsl(var(--primary))/0.35]
                            blur-sm
                            opacity-80
                          "
                          aria-hidden="true"
                        />

                        {/* actual avatar */}
                        <div
                          className="
                            relative flex h-8 w-8 items-center justify-center
                            rounded-full
                            border border-[hsl(var(--primary))/0.5]
                            bg-[hsl(var(--background))]
                            text-xs font-semibold tracking-tight
                            text-[hsl(var(--primary))]
                            shadow-md
                          "
                        >
                          {currentUser.first_name.charAt(0).toUpperCase()}
                          {currentUser.last_name.charAt(0).toUpperCase()}
                        </div>
                      </div>

                      <div className="flex flex-col text-right leading-tight">
                        <span className="text-[0.68rem] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                          Signed in as
                        </span>
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {currentUser.first_name} {currentUser.last_name}
                        </span>
                      </div>
                    </div>
                  )}


                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="
                          h-8 w-8 flex items-center justify-center
                          rounded-full
                          border border-[hsl(var(--border))]
                          bg-[hsl(var(--card))]
                          text-[hsl(var(--muted-foreground))]
                          hover:bg-[hsl(var(--muted))]
                          transition-colors
                          shadow-sm
                        "
                        aria-label="User menu"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="
                          mt-2 rounded-lg 
                          border border-[hsl(var(--border))]
                          bg-[hsl(var(--card))]
                          shadow-xl
                          min-w-[140px]
                          py-1.5
                        "
                      >
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="
                            flex items-center gap-2
                            px-3 py-1.5
                            text-[0.85rem] font-medium
                            text-[hsl(var(--foreground))]
                            cursor-pointer
                            rounded-md
                            hover:bg-[hsl(var(--destructive))/0.06]
                            hover:text-[hsl(var(--destructive))]
                            focus:bg-[hsl(var(--destructive))/0.08]
                            focus:text-[hsl(var(--destructive))]
                            transition-colors
                          "
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </nav>
          </div>
        </header>

        {/* MODALS */}
        <LoginModal
          open={loginOpen}
          onOpenChange={setLoginOpen}
          setIsLoggedIn={setIsLoggedIn}
          openRegister={() => setRegisterOpen(true)}
        />

        <RegisterModal
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          openLogin={() => setLoginOpen(true)}
        />

        {/* CONTENT */}
        <div className="flex-grow pt-[7vh] bg-[hsl(var(--background))]">
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/groups" element={<Groups />} />
          </Routes>
        </div>

        {/* FOOTER - hidden on /groups */}
        {location.pathname !== "/groups" && (
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
        )}
      </div>
    </LoginContext.Provider>
  );
}

export default App;

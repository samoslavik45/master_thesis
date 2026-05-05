import React, { useState, useEffect, createContext } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";

import MainContent from "./MainContent";
import Profile from "./Profile";
import Groups from "./Groups";

import LoginModal from "@/components/LoginModal";
import RegisterModal from "@/components/RegisterModal";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "sonner";

import { MoreVertical, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { FullTextMode } from "./types";

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
  selectedRecoModel: "tfidf-v1" | "sbert-v1";
  setSelectedRecoModel: (v: "tfidf-v1" | "sbert-v1") => void;

  selectedFullTextMode: FullTextMode;
  setSelectedFullTextMode: (v: FullTextMode) => void;
}

export const LoginContext = createContext<LoginContextType>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  openLogin: () => {},
  user: null,
  selectedRecoModel: "tfidf-v1",
  setSelectedRecoModel: () => {},

  selectedFullTextMode: "phrase",
  setSelectedFullTextMode: () => {},
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [selectedRecoModel, setSelectedRecoModel] = useState<"tfidf-v1" | "sbert-v1">("tfidf-v1");
  const [selectedFullTextMode, setSelectedFullTextMode] = useState<FullTextMode>("phrase");

  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, []);

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
        selectedRecoModel,
        setSelectedRecoModel,
        selectedFullTextMode,
        setSelectedFullTextMode,
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
              {/* Profile */}
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
                <div className="ml-4 flex items-center gap-3">
                  {currentUser && (
                    <div className="flex items-center gap-3">
                      <div className="relative h-8 w-8">
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
                            w-[360px] max-w-[90vw]
                            py-1.5
                          "
                        >
                        <div className="px-3 py-2">
                          <p className="text-[0.62rem] uppercase tracking-[0.13em] text-[hsl(var(--muted-foreground))]">
                            Recommendation model
                          </p>

                          <div className="mt-2 space-y-2">
                            <button
                              onClick={() => setSelectedRecoModel("tfidf-v1")}
                              className={`
                                w-full rounded-lg border px-3 py-2 text-left transition
                                ${
                                  selectedRecoModel === "tfidf-v1"
                                    ? "border-[hsl(var(--primary))/0.3] bg-[hsl(var(--primary))/0.08]"
                                    : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]"
                                }
                              `}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                                  TF-IDF
                                </span>
                                {selectedRecoModel === "tfidf-v1" && (
                                  <span className="text-[10px] font-semibold text-[hsl(var(--primary))]">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                                Statistical recommendation model based on term weighting.
                              </p>
                            </button>

                            <button
                              onClick={() => setSelectedRecoModel("sbert-v1")}
                              className={`
                                w-full rounded-lg border px-3 py-2 text-left transition
                                ${
                                  selectedRecoModel === "sbert-v1"
                                    ? "border-[hsl(var(--primary))/0.3] bg-[hsl(var(--primary))/0.08]"
                                    : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]"
                                }
                              `}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                                  SBERT
                                </span>
                                {selectedRecoModel === "sbert-v1" && (
                                  <span className="text-[10px] font-semibold text-[hsl(var(--primary))]">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                                Embedding-based recommendation model with semantic understanding.
                              </p>
                            </button>
                          </div>
                        </div>

                        <div className="my-1 h-px bg-[hsl(var(--border))]" />

                        <div className="px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
                          Search mode
                        </p>

                        <div className="mt-2 space-y-2">
                          <button
                            onClick={() => setSelectedFullTextMode("phrase")}
                            className={`
                              w-full rounded-lg border px-3 py-2 text-left transition
                              ${
                                selectedFullTextMode === "phrase"
                                  ? "border-[hsl(var(--primary))/0.3] bg-[hsl(var(--primary))/0.08]"
                                  : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]"
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                                Full-text phrase
                              </span>
                              {selectedFullTextMode === "phrase" && (
                                <span className="text-[10px] font-semibold text-[hsl(var(--primary))]">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                              Exact phrase search inside article text.
                            </p>
                          </button>

                          <button
                            onClick={() => setSelectedFullTextMode("intelligent")}
                            className={`
                              w-full rounded-lg border px-3 py-2 text-left transition
                              ${
                                selectedFullTextMode === "intelligent"
                                  ? "border-[hsl(var(--primary))/0.3] bg-[hsl(var(--primary))/0.08]"
                                  : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]"
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                                Intelligent search
                              </span>
                              {selectedFullTextMode === "intelligent" && (
                                <span className="text-[10px] font-semibold text-[hsl(var(--primary))]">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                              Indexed PostgreSQL full-text search with relevance ranking.
                            </p>
                          </button>
                        </div>
                      </div>

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
            Pôvodne navrhol a vytvoril Samuel Slávik ako bakalársku prácu (2024), neskôr rozšíril a upravil v rámci diplomovej práce (2026) na FMFI UK.
          </footer>
        )}
      </div>
    </LoginContext.Provider>
  );
}

export default App;

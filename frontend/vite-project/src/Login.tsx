import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setIsLoggedIn: (v: boolean) => void;
}

export default function LoginModal({
  open,
  onOpenChange,
  setIsLoggedIn,
}: LoginModalProps) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("http://localhost:8000/api/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok && data.access) {
      localStorage.setItem("accessToken", data.access);
      setIsLoggedIn(true);   // 🔥 spustí prerender App + Profile
      onOpenChange(false);   // zavrie modal
    } else {
      setMsg("Incorrect login information.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-w-sm w-full rounded-2xl p-0
          bg-[hsl(var(--card))]
          border border-[hsl(var(--border))]
          shadow-2xl
        "
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-[hsl(var(--foreground))]">
            Login to your account
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--muted-foreground))]">
            Enter your credentials to continue.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-none shadow-none bg-transparent">
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-4 px-6 pb-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-[hsl(var(--muted-foreground))]">
                  Username
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-[hsl(var(--muted))]"
                  placeholder="your username"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-[hsl(var(--muted-foreground))]">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[hsl(var(--muted))]"
                  placeholder="•••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                className="
                  w-full rounded-xl py-2
                  bg-[hsl(var(--primary))]
                  text-[hsl(var(--primary-foreground))]
                "
              >
                Login
              </Button>

              {msg && <p className="text-center text-red-500">{msg}</p>}

              <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
                Don’t have an account?{" "}
                <button
                  type="button"
                  className="text-[hsl(var(--primary))] hover:underline"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/register");
                  }}
                >
                  Sign up
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

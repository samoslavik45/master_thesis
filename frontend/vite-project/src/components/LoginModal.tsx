import { useState } from "react";
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
import { toast } from "sonner";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  setIsLoggedIn: (v: boolean) => void;
  openRegister: () => void;
}

export default function LoginModal({
  open,
  onOpenChange,
  setIsLoggedIn,
  openRegister,
}: LoginModalProps) {
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
      setIsLoggedIn(true);

      // 🎉 SONNER TOAST — luxusný cappuccino štýl
      toast.success("Successfully logged in", {
        description: "Welcome back!",
        style: {
          background: "hsl(35 40% 95%)",
          color: "hsl(35 25% 15%)",
          border: "1px solid hsl(35 30% 82%)",
          borderRadius: "14px",
          backdropFilter: "blur(6px)",
        },
      });

      onOpenChange(false);
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
            Enter your login details to continue.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-none shadow-none bg-transparent">
          <CardContent>
            <form
              onSubmit={handleLogin}
              className="flex flex-col gap-4 px-6 pb-6"
            >
              <Input
                placeholder="Username"
                className="bg-[hsl(var(--muted))]"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <Input
                placeholder="Password"
                type="password"
                className="bg-[hsl(var(--muted))]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                className="
                  w-full rounded-xl
                  bg-[hsl(var(--primary))]
                  text-[hsl(var(--primary-foreground))]
                  hover:scale-[1.03] transition
                "
              >
                Login
              </Button>

              {msg && (
                <p className="text-center text-[hsl(var(--foreground))]">
                  {msg}
                </p>
              )}

              <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
                Don’t have an account?{" "}
                <button
                  type="button"
                  className="text-[hsl(var(--primary))] hover:underline"
                  onClick={() => {
                    onOpenChange(false);
                    openRegister();
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

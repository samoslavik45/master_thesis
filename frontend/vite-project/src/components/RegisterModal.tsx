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

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  openLogin: () => void; // preklik späť na login modal
}

export default function RegisterModal({
  open,
  onOpenChange,
  openLogin,
}: RegisterModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [msg, setMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch("http://localhost:8000/api/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        email,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // ✨ SONNER SUCCESS TOAST
      toast.success("Registration successful!", {
        description: "You can now log in to your account.",
        style: {
          background: "hsl(35 40% 95%)",
          color: "hsl(35 25% 15%)",
          border: "1px solid hsl(35 30% 82%)",
          borderRadius: "14px",
          backdropFilter: "blur(6px)",
        },
      });

      setMsg("");

      setTimeout(() => {
        onOpenChange(false); // zavri register modal
        openLogin(); // otvor login modal
      }, 800);
    } else {
      setMsg(data.detail || "Registration failed.");
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
            Create your account
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--muted-foreground))]">
            Fill in your details to register.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-none shadow-none bg-transparent">
          <CardContent>
            <form
              onSubmit={handleRegister}
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
                placeholder="Email"
                type="email"
                className="bg-[hsl(var(--muted))]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

              <Input
                placeholder="First name"
                className="bg-[hsl(var(--muted))]"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />

              <Input
                placeholder="Last name"
                className="bg-[hsl(var(--muted))]"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
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
                Register
              </Button>

              {msg && (
                <p className="text-center text-[hsl(var(--foreground))]">
                  {msg}
                </p>
              )}

              <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-[hsl(var(--primary))] hover:underline"
                  onClick={() => {
                    onOpenChange(false);
                    openLogin();
                  }}
                >
                  Login
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

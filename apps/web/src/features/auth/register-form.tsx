"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetcher } from "@/lib/api-fetcher";
import { AUTH_REGISTER } from "@/lib/constants/endpoints";
import { POST } from "@/lib/constants/http";
import { AUDIOS_PAGE, LOGIN_PAGE } from "@/lib/constants/pages";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiFetcher(AUTH_REGISTER, { data: { name, email, password }, method: POST });

      await signIn("credentials", {
        email,
        password,
        redirectTo: AUDIOS_PAGE,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center px-4 min-h-screen">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 font-bold text-2xl text-center">Create your account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 p-3 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <Input
            id="name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            label="Password (min 8 characters)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          <Button type="submit" disabled={loading} className="w-full mt-8">
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-muted-foreground text-center">
          Already have an account?{" "}
          <Link href={LOGIN_PAGE} className="text-accent hover:text-accent">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

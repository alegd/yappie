"use client";

import { Button } from "@/components/ui/button";
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

          <div>
            <label htmlFor="name" className="block mb-1 font-medium text-foreground/50 text-sm">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface px-3 py-2 border border-border-hover focus:border-primary rounded-lg focus:outline-none w-full text-sm transition"
            />
          </div>

          <div>
            <label htmlFor="email" className="block mb-1 font-medium text-muted text-sm">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-surface px-3 py-2 border border-border-hover focus:border-primary rounded-lg focus:outline-none w-full text-sm transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 font-medium text-muted text-sm">
              Password (min 8 characters)
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surface px-3 py-2 border border-border-hover focus:border-primary rounded-lg focus:outline-none w-full text-sm transition"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-muted-foreground text-sm text-center">
          Already have an account?{" "}
          <Link href={LOGIN_PAGE} className="text-accent hover:text-accent">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

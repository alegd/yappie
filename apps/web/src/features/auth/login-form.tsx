"use client";

import { AUDIOS_PAGE, REGISTER_PAGE } from "@/lib/constants/pages";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: AUDIOS_PAGE,
      });
    } catch {
      setError("Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center px-4 min-h-screen">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 font-bold text-2xl text-center">Log in to Yappie</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 p-3 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block mb-1 font-medium text-zinc-400 text-sm">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900 px-3 py-2 border border-zinc-700 focus:border-indigo-500 rounded-lg focus:outline-none w-full text-sm transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 font-medium text-zinc-400 text-sm">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-900 px-3 py-2 border border-zinc-700 focus:border-indigo-500 rounded-lg focus:outline-none w-full text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg w-full font-medium text-sm transition"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-zinc-500 text-sm text-center">
          Don&apos;t have an account?{" "}
          <Link href={REGISTER_PAGE} className="text-indigo-400 hover:text-indigo-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { publicFetcher } from "@/lib/public-fetcher";
import {
  AUTH_REQUEST_OTP,
  AUTH_VERIFY_OTP,
  AUTH_COMPLETE_REGISTER,
} from "@/lib/constants/endpoints";
import { AUDIOS_PAGE } from "@/lib/constants/pages";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STEP = {
  EMAIL: "email",
  OTP: "otp",
  NAME: "name",
} as const;

type Step = (typeof STEP)[keyof typeof STEP];

const COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 4;

interface OtpResponse {
  sent: boolean;
}

interface VerifyResponse {
  isNewUser: boolean;
  verified?: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: { id: string; email: string; name: string };
}

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string };
}

const TITLES: Record<Step, string> = {
  email: "What's your email?",
  otp: "Check your inbox",
  name: "What should we call you?",
};

function getSubtitle(step: Step, email: string): string {
  const subtitles: Record<Step, string> = {
    email: "We'll send you a code to sign in",
    otp: `We sent a 4-digit code to ${email}`,
    name: "One last thing before you get started",
  };
  return subtitles[step];
}

export function AuthFlow() {
  const [step, setStep] = useState<Step>(STEP.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const submittingOtp = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await publicFetcher<OtpResponse>(AUTH_REQUEST_OTP, {
        data: { email },
      });
      setStep(STEP.OTP);
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (submittingOtp.current) return;
    submittingOtp.current = true;
    setError("");
    setLoading(true);

    try {
      const response = await publicFetcher<VerifyResponse>(AUTH_VERIFY_OTP, {
        data: { email, code },
      });

      if (!response.isNewUser && response.accessToken && response.user) {
        await signIn("credentials", {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          userId: response.user.id,
          email: response.user.email,
          name: response.user.name,
          redirectTo: AUDIOS_PAGE,
        });
      } else {
        setStep(STEP.NAME);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
      submittingOtp.current = false;
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Handle paste of full code
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);

      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      otpRefs.current[nextIndex]?.focus();

      if (newOtp.every((d) => d !== "")) {
        handleVerifyOtp(newOtp.join(""));
      }
      return;
    }

    // Single digit
    const digit = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "")) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError("");
    setLoading(true);

    try {
      await publicFetcher<OtpResponse>(AUTH_REQUEST_OTP, {
        data: { email },
      });
      setCooldown(COOLDOWN_SECONDS);
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await publicFetcher<RegisterResponse>(AUTH_COMPLETE_REGISTER, {
        data: { email, code: otp.join(""), name },
      });

      await signIn("credentials", {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        userId: response.user.id,
        email: response.user.email,
        name: response.user.name,
        redirectTo: AUDIOS_PAGE,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError("");
    if (step === STEP.OTP) {
      setStep(STEP.EMAIL);
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
    } else if (step === STEP.NAME) {
      setStep(STEP.OTP);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {step !== STEP.EMAIL && (
          <button
            type="button"
            onClick={handleBack}
            className="mb-4 text-sm text-muted-foreground hover:text-foreground transition"
            aria-label="Back"
          >
            &larr; Back
          </button>
        )}

        <h1 className="mb-2 text-center text-2xl font-bold">{TITLES[step]}</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">{getSubtitle(step, email)}</p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {step === STEP.EMAIL && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Button type="submit" disabled={loading} className="mt-4 w-full">
              {loading ? "Sending..." : "Continue"}
            </Button>
          </form>
        )}

        {step === STEP.OTP && (
          <div className="space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="h-14 w-14 rounded-lg border border-border-hover bg-surface text-center text-2xl font-bold focus:border-primary focus:outline-none transition"
                  aria-label={`Digit ${index + 1}`}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="text-center">
              {cooldown > 0 ? (
                <span className="text-sm text-muted-foreground">Resend code in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm text-accent hover:text-accent/80 transition disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
            </div>
          </div>
        )}

        {step === STEP.NAME && (
          <form onSubmit={handleCompleteRegister} className="space-y-4">
            <Input
              id="name"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <Button type="submit" disabled={loading} className="mt-4 w-full">
              {loading ? "Creating..." : "Create account"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

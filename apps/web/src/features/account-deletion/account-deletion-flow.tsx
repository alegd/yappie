"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCOUNT_DELETE_CONFIRM, ACCOUNT_DELETE_REQUEST } from "@/lib/constants/endpoints";
import { publicFetcher } from "@/lib/public-fetcher";

type Step = "request" | "confirm" | "done";

interface AccountDeletionFlowProps {
  mode: "authenticated" | "public";
  initialEmail?: string;
  onDeleted?: () => void;
}

const CONFIRM_PHRASE = "DELETE";
const OTP_LENGTH = 4;

export function AccountDeletionFlow({
  mode,
  initialEmail,
  onDeleted,
}: AccountDeletionFlowProps) {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [otp, setOtp] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  async function handleRequest() {
    setError(null);
    setLoading(true);
    try {
      await publicFetcher(ACCOUNT_DELETE_REQUEST, { data: { email } });
      setStep("confirm");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    const code = otp.join("");
    try {
      await publicFetcher(ACCOUNT_DELETE_CONFIRM, { data: { email, code } });
      if (mode === "authenticated") {
        onDeleted?.();
      } else {
        setStep("done");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  if (step === "done") {
    return (
      <div className="mx-auto max-w-md text-center">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">
          Your account has been deleted
        </h2>
        <p className="text-foreground/70">
          We&apos;ve removed your account and all of its data from Yappie. A confirmation email is
          on its way.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-2 text-2xl font-semibold text-foreground">Delete your account</h2>
      <p className="mb-6 text-sm text-foreground/70">
        This permanently removes your account, projects, recordings, tickets and integrations.
        This action cannot be undone.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {step === "request" && (
        <>
          {mode === "authenticated" ? (
            <p className="mb-4 rounded-lg border border-border-hover bg-surface px-3 py-2 text-sm text-foreground/85">
              {email}
            </p>
          ) : (
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4"
            />
          )}
          <Button
            variant="danger"
            className="w-full"
            disabled={loading || (!email && mode === "public")}
            onClick={handleRequest}
          >
            {loading ? "Sending..." : "Send verification code"}
          </Button>
        </>
      )}

      {step === "confirm" && (
        <>
          <p className="mb-3 text-sm text-foreground/70">
            We sent a 4-digit code to <span className="text-foreground">{email}</span>. Enter it
            below.
          </p>
          <div className="mb-4 flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                value={digit}
                aria-label={`digit ${i + 1}`}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="h-14 w-14 rounded-lg border border-border-hover bg-surface text-center text-xl font-semibold text-foreground focus:border-primary focus:outline-none"
              />
            ))}
          </div>

          <Input
            type="text"
            placeholder={`Type ${CONFIRM_PHRASE} to confirm`}
            value={confirmPhrase}
            onChange={(e) => setConfirmPhrase(e.target.value)}
            className="mb-4"
          />

          <Button
            variant="danger"
            className="w-full"
            disabled={loading || confirmPhrase !== CONFIRM_PHRASE || otp.join("").length !== OTP_LENGTH}
            onClick={handleConfirm}
          >
            {loading ? "Deleting..." : "Delete my account permanently"}
          </Button>
        </>
      )}
    </div>
  );
}

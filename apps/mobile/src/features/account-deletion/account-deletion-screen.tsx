import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { colors, font, fontSize, spacing } from "@/constants/theme";
import { useAuthStore } from "@/features/auth/auth-store";
import { deleteAccountConfirm, deleteAccountRequest } from "@/lib/api/account";

const OTP_LENGTH = 4;
const CONFIRM_PHRASE = "DELETE";

type Step = "request" | "confirm";

export function AccountDeletionScreen() {
  const email = useAuthStore((s) => s.user?.email);
  const logout = useAuthStore((s) => s.logout);
  const [step, setStep] = useState<Step>("request");
  const [code, setCode] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [error, setError] = useState<string | undefined>();

  const requestMutation = useMutation({
    mutationFn: (target: string) => deleteAccountRequest(target),
  });

  const confirmMutation = useMutation({
    mutationFn: (args: { email: string; code: string }) =>
      deleteAccountConfirm(args.email, args.code),
  });

  async function handleRequest() {
    if (!email) return;
    setError(undefined);
    try {
      await requestMutation.mutateAsync(email);
      setStep("confirm");
    } catch {
      setError("Couldn't send code. Try again.");
    }
  }

  async function handleConfirm() {
    if (!email) return;
    setError(undefined);
    try {
      await confirmMutation.mutateAsync({ email, code });
      await logout();
      // The (app)/_layout guard redirects to /(auth)/welcome when accessToken clears.
    } catch {
      setError("Couldn't delete account. Try again.");
    }
  }

  const canConfirm = code.length === OTP_LENGTH && confirmPhrase === CONFIRM_PHRASE;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Delete your account</Text>
      <Text style={styles.body}>
        This permanently removes your account, projects, recordings, tickets and integrations.
        This action cannot be undone.
      </Text>

      {step === "request" && (
        <>
          <Text style={styles.email}>{email}</Text>
          <Button
            label="Send verification code"
            onPress={handleRequest}
            loading={requestMutation.isPending}
            variant="danger"
          />
        </>
      )}

      {step === "confirm" && (
        <>
          <Text style={styles.body}>
            We sent a {OTP_LENGTH}-digit code to {email}. Enter it below.
          </Text>
          <Input
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, OTP_LENGTH))}
            placeholder="1234"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
          />
          <Input
            value={confirmPhrase}
            onChangeText={setConfirmPhrase}
            placeholder={`Type ${CONFIRM_PHRASE} to confirm`}
            autoCapitalize="characters"
          />
          <Button
            label="Delete my account permanently"
            onPress={handleConfirm}
            disabled={!canConfirm}
            loading={confirmMutation.isPending}
            variant="danger"
          />
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontFamily: font.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.text,
  },
  body: {
    fontFamily: font.body.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  email: {
    fontFamily: font.body.medium,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  error: {
    fontFamily: font.body.regular,
    fontSize: fontSize.sm,
    color: colors.danger,
  },
});

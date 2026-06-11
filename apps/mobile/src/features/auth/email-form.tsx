import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { colors, font, fontSize, spacing } from "@/constants/theme";
import { useAuth } from "./use-auth";

const emailSchema = z.email("Enter a valid email");

export function EmailForm() {
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const { requestOtp } = useAuth();

  const handleSubmit = async () => {
    setValidationError(undefined);
    setSubmitError(undefined);

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }

    try {
      await requestOtp.mutateAsync(parsed.data);
      router.push({ pathname: "/verify", params: { email: parsed.data } });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429) {
        setSubmitError("Too many requests. Wait a minute and try again.");
      } else {
        setSubmitError("Couldn't send code. Try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What&apos;s your email?</Text>
        <Text style={styles.subtitle}>We&apos;ll send you a code to sign in</Text>
      </View>

      <Input
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={validationError}
      />

      <Button
        label="Continue"
        onPress={handleSubmit}
        loading={requestOtp.isPending}
        disabled={requestOtp.isPending}
      />

      {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.lg,
  },
  header: {
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontFamily: font.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: font.body.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
  },
  error: {
    fontFamily: font.body.regular,
    fontSize: fontSize.sm,
    color: colors.danger,
  },
});

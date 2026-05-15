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
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>Enter your email to receive a 4-digit code.</Text>

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
        label="Send code"
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
    width: "100%",
    gap: spacing.lg,
  },
  title: {
    fontFamily: font.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.text,
  },
  subtitle: {
    fontFamily: font.body.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  error: {
    fontFamily: font.body.regular,
    fontSize: fontSize.sm,
    color: colors.danger,
  },
});

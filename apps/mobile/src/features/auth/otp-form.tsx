import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "./use-auth";
import { ApiError } from "@/lib/api-error";

const OTP_LENGTH = 4;
const OTP_PLACEHOLDER = "1234";

interface OtpFormProps {
  email: string;
}

export function OtpForm({ email }: OtpFormProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [needsRegister, setNeedsRegister] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const { verifyOtp, completeRegister } = useAuth();
  const isPending = verifyOtp.isPending || completeRegister.isPending;

  const handleSubmit = async () => {
    setError(undefined);

    if (needsRegister) {
      try {
        await completeRegister.mutateAsync({ email, code, name });
        router.replace("/(tabs)");
      } catch {
        setError("Couldn't complete registration. Try again.");
      }
      return;
    }

    try {
      await verifyOtp.mutateAsync({ email, code });
      router.replace("/(tabs)");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setNeedsRegister(true);
        } else if (err.status === 400 || err.status === 401) {
          setError("Incorrect or expired code.");
        } else {
          setError("Couldn't verify code. Try again.");
        }
      } else {
        setError("Couldn't verify code. Try again.");
      }
    }
  };

  const codeIsComplete = code.length === OTP_LENGTH;
  const nameIsValid = !needsRegister || name.trim().length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter code</Text>
      <Text style={styles.subtitle}>We sent a {OTP_LENGTH}-digit code to {email}.</Text>

      <Input
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, OTP_LENGTH))}
        placeholder={OTP_PLACEHOLDER}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        error={error}
      />

      {needsRegister ? (
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
        />
      ) : null}

      <Button
        label={needsRegister ? "Create account" : "Verify"}
        onPress={handleSubmit}
        loading={isPending}
        disabled={isPending || !codeIsComplete || !nameIsValid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fafafa",
  },
  subtitle: {
    fontSize: 16,
    color: "#71717a",
  },
});

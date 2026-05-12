import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/layout/screen-container";
import { OtpForm } from "@/features/auth/otp-form";

export default function VerifyPage() {
  const { email } = useLocalSearchParams<{ email: string }>();
  return (
    <ScreenContainer>
      <OtpForm email={email ?? ""} />
    </ScreenContainer>
  );
}

import { TextInput, View, Text, StyleSheet, type TextInputProps } from "react-native";
import { colors, radii, spacing, fontSize } from "@/constants/theme";

interface InputProps extends TextInputProps {
  error?: string;
}

export function Input({ error, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        placeholderTextColor={colors.textDim}
        style={[styles.input, error ? styles.inputError : null, style]}
      />
      {error ? (
        <Text testID="input-error" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    width: "100%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: fontSize.md,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.danger,
  },
});

import { TextInput, View, Text, StyleSheet, type TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  error?: string;
}

export function Input({ error, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        placeholderTextColor="#71717a"
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    backgroundColor: "#18181b",
    color: "#fafafa",
    fontSize: 16,
  },
  inputError: {
    borderColor: "#f87171",
  },
  errorText: {
    marginTop: 4,
    fontSize: 14,
    color: "#f87171",
  },
});

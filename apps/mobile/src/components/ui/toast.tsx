import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { borderWidth, colors, duration, fontSize, fontWeight, radii, spacing } from "@/constants/theme";

export type ToastVariant = "success" | "error" | "info";

export interface ToastEntry {
  id: number;
  message: string;
  variant: ToastVariant;
}

type Listener = (entry: ToastEntry) => void;

const listeners = new Set<Listener>();
let nextId = 0;

function emit(message: string, variant: ToastVariant) {
  const entry: ToastEntry = { id: ++nextId, message, variant };
  for (const listener of listeners) listener(entry);
}

export const toast = {
  success(message: string) {
    emit(message, "success");
  },
  error(message: string) {
    emit(message, "error");
  },
  info(message: string) {
    emit(message, "info");
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

const variantColor: Record<ToastVariant, string> = {
  success: colors.success,
  error: colors.danger,
  info: colors.info,
};

export function ToastContainer() {
  const [entries, setEntries] = useState<ToastEntry[]>([]);

  useEffect(() => {
    return toast.subscribe((entry) => {
      setEntries((prev) => [...prev, entry]);
      setTimeout(() => {
        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      }, duration.toastDismiss);
    });
  }, []);

  if (entries.length === 0) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      {entries.map((entry) => (
        <View
          key={entry.id}
          style={[styles.toast, { borderColor: variantColor[entry.variant] }]}
        >
          <Text style={[styles.message, { color: variantColor[entry.variant] }]}>
            {entry.message}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: spacing.xxl,
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
  },
  toast: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: borderWidth.thin,
  },
  message: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});

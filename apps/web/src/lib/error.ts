import { toast } from "@/components/ui/toast/Toast";

export const showError = (error: unknown) => {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected error occurred";
  toast.error(errorMessage);
};

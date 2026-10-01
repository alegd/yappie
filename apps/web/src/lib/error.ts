import { toast } from "@/components/ui/toast/Toast";

const BULLET = "• ";
const UNEXPECTED_ERROR_MESSAGE = "An unexpected error occurred";

const bulletEachLine = (message: string) => {
  const lines = message.split("\n");
  if (lines.length < 2) return message;
  return lines.map((line) => BULLET + line).join("\n");
};

export const showError = (error: unknown) => {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : UNEXPECTED_ERROR_MESSAGE;
  toast.error(bulletEachLine(errorMessage));
};

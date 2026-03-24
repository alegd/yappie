import { toast } from "@/components/ui/toast/Toast";

export const showError = (error: Error) => {
  const errorMessage = JSON.stringify(error);
  toast.error(errorMessage.replace(/"/g, ""));
};

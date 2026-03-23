"use client";

import { Toaster } from "sonner";

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: Readonly<ToastProviderProps>) {
  return (
    <>
      {children}

      <Toaster
        position="bottom-center"
        theme="dark"
        closeButton={false}
        duration={5000}
        toastOptions={{
          style: {
            fontSize: "14px",
          },
        }}
      />
    </>
  );
}

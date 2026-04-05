"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Check, Info, X } from "lucide-react";
import React from "react";

const variantIcons = {
  default: Info,
  success: Check,
  error: X,
};

const variantBgColors = {
  default: "bg-gray-500",
  success: "bg-emerald-500",
  error: "bg-red-500",
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "rounded-full flex items-center justify-center gap-2 h-8 w-8",
                  variantBgColors[props.variant || "default"],
                )}
              >
                {variantIcons[props.variant || "default"] && (
                  <div className="text-white">
                    {React.createElement(
                      variantIcons[props.variant || "default"],
                      {
                        className: "w-6 h-6",
                      },
                    )}
                  </div>
                )}
              </div>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

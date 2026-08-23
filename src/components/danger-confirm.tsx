"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DangerConfirm({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);

  function close() {
    setStep(1);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setStep(1);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Button className="h-11 w-full" onClick={close}>
                Keep it
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full"
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Last check</DialogTitle>
              <DialogDescription>
                This cannot be undone. {description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Button className="h-11 w-full" onClick={close}>
                Keep it
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="h-11 w-full"
                onClick={() => {
                  onConfirm();
                  close();
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

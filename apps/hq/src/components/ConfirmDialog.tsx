import type { ReactNode } from "react";
import { Button, Dialog } from "@sal-ishi/ui";

export function ConfirmDialog(props: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title={props.title}
      width={560}
      footer={
        <>
          <Button variant={props.danger ? "danger" : "primary"} disabled={props.confirmDisabled} onClick={props.onConfirm}>
            {props.confirmLabel}
          </Button>
          <Button variant="secondary" onClick={props.onClose}>ביטול</Button>
        </>
      }
    >
      {props.children}
    </Dialog>
  );
}

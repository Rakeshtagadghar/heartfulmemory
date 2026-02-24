"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { ExportModal } from "./ExportModal";

export function ExportButton({ storybookId }: { storybookId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Export
      </Button>
      <ExportModal storybookId={storybookId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}


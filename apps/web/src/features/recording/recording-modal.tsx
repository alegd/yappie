"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast/Toast";
import type { ProjectListResponse } from "@/features/projects/types";
import { invalidateQuery, useQuery } from "@/hooks/use-query";
import { ACTIVITY_FEED, audioByProject, PROJECTS_LIST } from "@/lib/constants/endpoints";
import { cn } from "@/lib/utils";
import { ProcessingState } from "./processing-state";
import { RecordTab } from "./record-tab";
import { useRecordingModalStore } from "./recording-modal-store";
import { UploadTab } from "./upload-tab";

type ModalState =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "processing"; audioId: string }
  | { kind: "error"; message: string; retryable: boolean };

type Mode = "record" | "upload";

export function RecordingModal() {
  const isOpen = useRecordingModalStore((s) => s.isOpen);
  const storeProjectId = useRecordingModalStore((s) => s.projectId);
  const close = useRecordingModalStore((s) => s.close);

  const [state, setState] = useState<ModalState>({ kind: "idle" });
  const [mode, setMode] = useState<Mode>("record");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const { data: projectsData } = useQuery<ProjectListResponse>(isOpen ? PROJECTS_LIST : null);
  const projects = projectsData?.data ?? [];

  useEffect(() => {
    if (isOpen) {
      setState({ kind: "idle" });
      setMode("record");
      setSelectedProjectId("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && typeof MediaRecorder === "undefined" && mode === "record") {
      setMode("upload");
      toast.info("Recording not supported in this browser, using upload instead");
    }
  }, [isOpen]);

  const effectiveProjectId = storeProjectId ?? selectedProjectId;
  const projectName = projects.find((p) => p.id === storeProjectId)?.name;

  const handleUploaded = (audioId: string) => {
    setState({ kind: "processing", audioId });
  };

  const handleError = (message: string, retryable: boolean) => {
    setState({ kind: "error", message, retryable });
  };

  const handleUploadingChange = (isUploading: boolean) => {
    if (isUploading) {
      setState((prev) => (prev.kind === "idle" ? { kind: "uploading" } : prev));
    }
  };

  const handleCompleted = (ticketCount: number) => {
    toast.success(`${ticketCount} ticket${ticketCount !== 1 ? "s" : ""} generated`);
    if (effectiveProjectId) {
      invalidateQuery(audioByProject(effectiveProjectId));
    }
    invalidateQuery(ACTIVITY_FEED);
    close();
  };

  const handleFailed = (message: string) => {
    setState({ kind: "error", message, retryable: true });
  };

  const handleTimeout = () => {
    toast.info("Processing in background. Check the project later.");
    close();
  };

  const handleRetry = () => {
    setState({ kind: "idle" });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          aria-label="Recording"
          className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface border border-border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-bold text-lg">Record</Dialog.Title>
            <Dialog.Close
              aria-label="Close recording modal"
              className="text-muted-foreground hover:text-foreground transition"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          {storeProjectId === null ? (
            <div className="mb-4">
              <AppSelect
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
                placeholder="Select project"
                ariaLabel="Project"
              />
            </div>
          ) : (
            <div className="mb-4 text-xs text-foreground/50">
              Recording for:{" "}
              <span className="font-medium text-foreground/75">
                {projectName ?? storeProjectId}
              </span>
            </div>
          )}

          {state.kind === "idle" && (
            <div className="flex border-b border-border mb-4" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "record"}
                onClick={() => setMode("record")}
                className={cn(
                  "px-4 py-2 text-sm border-b-2 transition",
                  mode === "record"
                    ? "border-accent text-accent"
                    : "border-transparent text-foreground/50",
                )}
              >
                Record
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "upload"}
                onClick={() => setMode("upload")}
                className={cn(
                  "px-4 py-2 text-sm border-b-2 transition",
                  mode === "upload"
                    ? "border-accent text-accent"
                    : "border-transparent text-foreground/50",
                )}
              >
                Upload
              </button>
            </div>
          )}

          {state.kind === "idle" && mode === "record" && (
            <RecordTab
              projectId={effectiveProjectId}
              disabled={!effectiveProjectId}
              onUploaded={handleUploaded}
              onError={handleError}
              onUploadingChange={handleUploadingChange}
            />
          )}
          {state.kind === "idle" && mode === "upload" && (
            <UploadTab
              projectId={effectiveProjectId}
              disabled={!effectiveProjectId}
              onUploaded={handleUploaded}
              onError={handleError}
              onUploadingChange={handleUploadingChange}
            />
          )}
          {state.kind === "uploading" && (
            <div className="flex flex-col items-center gap-2 py-8" aria-label="Uploading">
              <Loader2 size={24} className="animate-spin" />
              <p className="text-sm">Uploading…</p>
            </div>
          )}
          {state.kind === "processing" && (
            <ProcessingState
              audioId={state.audioId}
              onCompleted={handleCompleted}
              onFailed={handleFailed}
              onTimeout={handleTimeout}
              onCancel={close}
            />
          )}
          {state.kind === "error" && (
            <div className="py-4">
              <p className="text-sm text-destructive mb-3" role="alert">
                {state.message}
              </p>
              <div className="flex gap-2">
                {state.retryable && <Button onClick={handleRetry}>Retry</Button>}
                <Button variant="outlined" onClick={close}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

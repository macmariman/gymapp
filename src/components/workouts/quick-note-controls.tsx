"use client"

import { useState } from "react"
import { NotebookPen } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  exerciseQuickNoteOptions,
  getUsedSessionQuickNoteValues,
  sessionQuickNoteOptions,
} from "@/lib/workouts/quick-notes"
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ExerciseQuickNoteTriggerProps = {
  exerciseName: string
  setNumber: number
  onClick: () => void
}

type ExerciseQuickNoteDialogProps = {
  exerciseName: string | null
  open: boolean
  onAddNote: (selectedValues: string[], detail: string) => void
  onOpenChange: (open: boolean) => void
}

type SessionQuickNoteChipsProps = {
  note: string
  onAddNote: (value: string) => void
}

export function ExerciseQuickNoteTrigger({
  exerciseName,
  setNumber,
  onClick,
}: ExerciseQuickNoteTriggerProps) {
  return (
    <button
      aria-label={`Agregar nota rápida para ${exerciseName} serie ${setNumber}`}
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      onClick={onClick}
      type="button"
    >
      <NotebookPen className="size-3.5" />
    </button>
  )
}

export function ExerciseQuickNoteDialog({
  exerciseName,
  open,
  onAddNote,
  onOpenChange,
}: ExerciseQuickNoteDialogProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const [detail, setDetail] = useState("")
  const canAddNote = selectedValues.length > 0 || detail.trim().length > 0

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedValues([])
      setDetail("")
    }

    onOpenChange(nextOpen)
  }

  function handleToggleValue(value: string) {
    setSelectedValues((currentValues) =>
      currentValues.includes(value)
        ? currentValues.filter((currentValue) => currentValue !== value)
        : [...currentValues, value]
    )
  }

  function handleAddNote() {
    if (!canAddNote) {
      return
    }

    onAddNote(selectedValues, detail)
    setSelectedValues([])
    setDetail("")
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {exerciseName ? `Nota rápida: ${exerciseName}` : "Nota rápida"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Agregar una nota rápida al ejercicio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {exerciseQuickNoteOptions.map((option) => {
              const isSelected = selectedValues.includes(option.value)

              return (
                <Button
                  aria-pressed={isSelected}
                  className={cn(
                    "h-8 rounded-md border-border px-2.5 text-xs",
                    isSelected
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : ""
                  )}
                  key={option.value}
                  onClick={() => handleToggleValue(option.value)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {option.label}
                </Button>
              )
            })}
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
            Detalle opcional
            <AutoResizeTextarea
              className="min-h-32 w-full rounded-md border-2 border-border bg-muted px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-accent focus:bg-accent/10 sm:min-h-24"
              maxLength={180}
              onChange={(event) => setDetail(event.target.value)}
              value={detail}
            />
          </label>
        </div>

        <DialogFooter>
          <Button
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancelar
          </Button>
          <Button
            className="h-12 w-full rounded-md"
            disabled={!canAddNote}
            onClick={handleAddNote}
            type="button"
            variant="action"
          >
            Agregar nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SessionQuickNoteChips({
  note,
  onAddNote,
}: SessionQuickNoteChipsProps) {
  const usedValues = getUsedSessionQuickNoteValues(note)

  return (
    <div className="flex flex-wrap gap-2">
      {sessionQuickNoteOptions.map((option) => {
        const isUsed = usedValues.has(option.value)

        return (
          <Button
            aria-pressed={isUsed}
            className={cn(
              "h-8 rounded-md border-border px-2.5 text-xs",
              isUsed
                ? "bg-accent text-accent-foreground hover:bg-accent/90"
                : ""
            )}
            key={option.value}
            onClick={() => onAddNote(option.value)}
            size="sm"
            type="button"
            variant="outline"
          >
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}

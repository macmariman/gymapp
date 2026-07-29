"use client"

import Link from "next/link"
import {
  ArrowRightLeft,
  ChevronRight,
  History,
  NotebookPen,
  Trash2,
  Undo2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type ExerciseActionsSheetProps = {
  exerciseName: string
  isDayExercise: boolean
  isSwapped: boolean
  open: boolean
  progressHref: string
  targetLabel: string
  onAddNote: () => void
  onOpenChange: (open: boolean) => void
  onRemove: () => void
  onSwap: () => void
}

export function ExerciseActionsSheet({
  exerciseName,
  isDayExercise,
  isSwapped,
  open,
  progressHref,
  targetLabel,
  onAddNote,
  onOpenChange,
  onRemove,
  onSwap,
}: ExerciseActionsSheetProps) {
  function handleAction(action: () => void) {
    onOpenChange(false)
    action()
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="mx-auto max-h-[85dvh] max-w-xl rounded-t-xl pb-[max(1rem,env(safe-area-inset-bottom))]"
        side="bottom"
      >
        <SheetHeader className="pt-5 text-left">
          <SheetTitle className="pr-8">{exerciseName}</SheetTitle>
          <SheetDescription>{targetLabel}</SheetDescription>
        </SheetHeader>
        <Separator />

        <div className="flex flex-col gap-1 px-3">
          <Button
            asChild
            className="h-12 w-full justify-start px-3"
            variant="ghost"
          >
            <Link href={progressHref} onClick={() => onOpenChange(false)}>
              <History data-icon="inline-start" />
              Ver historial
              <ChevronRight className="ml-auto" data-icon="inline-end" />
            </Link>
          </Button>

          {!isDayExercise ? (
            <Button
              className="h-12 w-full justify-start px-3"
              onClick={() => handleAction(onSwap)}
              type="button"
              variant="ghost"
            >
              {isSwapped ? (
                <Undo2 data-icon="inline-start" />
              ) : (
                <ArrowRightLeft data-icon="inline-start" />
              )}
              {isSwapped ? "Deshacer intercambio" : "Intercambiar ejercicio"}
            </Button>
          ) : null}

          <Button
            className="h-12 w-full justify-start px-3"
            onClick={() => handleAction(onAddNote)}
            type="button"
            variant="ghost"
          >
            <NotebookPen data-icon="inline-start" />
            Agregar nota
          </Button>

          {isDayExercise ? (
            <>
              <Separator className="my-2" />
              <Button
                className="h-12 w-full justify-start px-3"
                onClick={() => handleAction(onRemove)}
                type="button"
                variant="destructive"
              >
                <Trash2 data-icon="inline-start" />
                Quitar del día
              </Button>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

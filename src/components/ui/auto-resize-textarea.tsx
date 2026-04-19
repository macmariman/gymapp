"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type AutoResizeTextareaProps = React.ComponentProps<"textarea">

function resizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto"
  textarea.style.height = `${textarea.scrollHeight}px`
}

function AutoResizeTextarea({
  className,
  onChange,
  value,
  ...props
}: AutoResizeTextareaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  React.useLayoutEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    resizeTextarea(textarea)
  }, [value])

  return (
    <textarea
      className={cn("resize-none overflow-hidden", className)}
      onChange={(event) => {
        resizeTextarea(event.currentTarget)
        onChange?.(event)
      }}
      ref={textareaRef}
      value={value}
      {...props}
    />
  )
}

export { AutoResizeTextarea }

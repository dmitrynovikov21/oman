"use client"

import { useRef, useEffect, useState } from "react"
import { useEditMode } from "@/lib/edit-mode-context"

interface EditableTextProps {
    id: string
    children: React.ReactNode
    className?: string
    as?: keyof JSX.IntrinsicElements
    allowHtml?: boolean // For texts with HTML like spans
}

export function EditableText({
    id,
    children,
    className = "",
    as: Component = "span",
    allowHtml = false,
}: EditableTextProps) {
    const { isEditMode, content, updateContent } = useEditMode()
    const ref = useRef<HTMLElement>(null)
    const [isFocused, setIsFocused] = useState(false)

    // Get the current value (from content or default children)
    const currentValue = content[id] || ""
    const defaultValue = typeof children === "string" ? children : ""
    const displayValue = currentValue || defaultValue

    // Store the original value when entering edit mode to compare against
    const originalValueRef = useRef<string>(displayValue)

    // Handle input - track changes in real-time
    const handleInput = () => {
        if (ref.current) {
            const newValue = allowHtml ? ref.current.innerHTML : ref.current.innerText
            // Compare against the original value, not the current displayValue
            if (newValue.trim() !== originalValueRef.current.trim()) {
                updateContent(id, newValue)
            }
        }
    }

    // Handle blur - ensure change is captured
    const handleBlur = () => {
        setIsFocused(false)
        handleInput() // Capture any final changes
    }

    // Handle focus - store original value
    const handleFocus = () => {
        setIsFocused(true)
        if (ref.current) {
            originalValueRef.current = allowHtml ? ref.current.innerHTML : ref.current.innerText
        }
    }

    // Update original value when displayValue changes (for initial load)
    useEffect(() => {
        originalValueRef.current = displayValue
    }, [displayValue])

    // Reset content when edit mode is disabled
    useEffect(() => {
        if (!isEditMode && ref.current) {
            if (allowHtml) {
                ref.current.innerHTML = displayValue
            } else {
                ref.current.innerText = displayValue
            }
        }
    }, [isEditMode, displayValue, allowHtml])

    // Base styles for edit mode
    const editModeStyles = isEditMode
        ? `cursor-text outline-none ring-offset-2 transition-all duration-200 ${isFocused
            ? "ring-2 ring-blue-500 bg-blue-50/50 rounded"
            : "hover:ring-2 hover:ring-blue-300 hover:bg-blue-50/30 rounded"
        }`
        : ""

    // Render the component
    const Tag = Component as any

    if (allowHtml) {
        return (
            <Tag
                ref={ref}
                className={`${className} ${editModeStyles}`}
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onBlur={handleBlur}
                onFocus={handleFocus}
                onInput={handleInput}
                dangerouslySetInnerHTML={{ __html: displayValue }}
                data-editable-id={id}
            />
        )
    }

    return (
        <Tag
            ref={ref}
            className={`${className} ${editModeStyles}`}
            contentEditable={isEditMode}
            suppressContentEditableWarning
            onBlur={handleBlur}
            onFocus={handleFocus}
            onInput={handleInput}
            data-editable-id={id}
        >
            {displayValue}
        </Tag>
    )
}

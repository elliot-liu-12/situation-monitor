"use client"

import { X } from "lucide-react"

interface TagProps {
  label: string
  selected?: boolean
  onToggle?: () => void
  onRemove?: () => void
  variant?: "default" | "selected" | "removable"
}

const Tag = ({ label, selected = false, onToggle, onRemove, variant = "default" }: TagProps) => {
  const baseClasses =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer"

  const variantClasses = {
    default: "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200",
    selected: "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200",
    removable: "bg-neutral-900 text-white hover:bg-neutral-900/90 border border-sl",
  }

  const getVariantClass = () => {
    if (variant === "removable") return variantClasses.removable
    if (selected) return variantClasses.selected
    return variantClasses.default
  }

  const handleClick = () => {
    if (variant === "removable" && onRemove) {
      onRemove()
    } else if (onToggle) {
      onToggle()
    }
  }

  return (
    <span className={`${baseClasses} ${getVariantClass()}`} onClick={handleClick}>
      {label}
      {variant === "removable" && <X className="w-4 h-4 ml-1 hover:bg-neutral-900/95 rounded-full p-0.5" />}
    </span>
  )
}

export default Tag

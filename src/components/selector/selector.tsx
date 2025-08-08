"use client"

import { useState, type KeyboardEvent } from "react"
import Tag from "./tag"
import { Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SelectorProps {
  placeholder?: string
  maxSelections?: number
  minCharacters?: number
  tags: string[]
  addTicker: (ticker: string) => void,
  removeTicker: (ticker: string) => void,
  resetTickers: () => void,
}

export const Selector = ({
  placeholder = "Add tickers (ex. AAPL)",
  maxSelections = 50,
  minCharacters = 2,
  tags,
  addTicker,
  removeTicker,
  resetTickers
}: SelectorProps) => {
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState("")
  const [loading, setIsLoading] = useState(false);

  const validateInput = (value: string): string => {
    if (value.length < minCharacters) {
      return `Ticker must be at least ${minCharacters} characters long`
    }
    if (tags.includes(value.toUpperCase())) {
      return "This ticker already exists"
    }
    if (tags.length >= maxSelections) {
      return `Maximum ${maxSelections} tickers allowed`
    }
    return ""
  }

  const handleAddTag = () => {
    const trimmedValue = inputValue.trim().toUpperCase()
    if (!trimmedValue) return

    const validationError = validateInput(trimmedValue)
    if (validationError) {
      setError(validationError)
      return
    }
    addTicker(trimmedValue);
    setInputValue("");
    setError("");
  }

  const removeTag = (tagToRemove: string) => {
    removeTicker(tagToRemove);
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag();
    }
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    // Clear error when user starts typing
    if (error) setError("")
  }

  const clearAll = () => {
    resetTickers();
    setError("")
  }

  const canAddTag =
    inputValue.trim().length >= minCharacters &&
    tags.length < maxSelections &&
    !tags.includes(inputValue.trim().toUpperCase())

  const onSaveButtonClicked = async () => {
      setIsLoading(true);
       const resp = await window.ipcRenderer.invoke("saveFile", "tickers.csv", tags.toString())
       if(resp.success == false)
        console.log("Save failed")
      else
      {
        console.log("Save succeeded.")
      }
      setIsLoading(false);
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="space-y-2">
        {/* Input Field */}
        <div className="relative">
          <div
            className={`flex items-center border rounded-lg bg-white transition-colors ${
              error ? "border-red-300 focus-within:border-red-500" : "border-gray-300 focus-within:border-blue-500"
            }`}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 bg-transparent outline-none text-gray-900 placeholder-gray-500"
              maxLength={5}
            />
            <button
              onClick={handleAddTag}
              disabled={!canAddTag}
              className={`m-1 p-2 rounded-md transition-colors ${
                canAddTag ? "bg-gray-100 text-gray-500 " : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Character Counter */}
          <div className="flex justify-between items-center mt-1 text-xs">
            <span className={`${inputValue.length < minCharacters ? "text-gray-400" : "text-green-600"}`}>
              {inputValue.length}/{minCharacters} characters
            </span>
            <span className="text-gray-400">
              {tags.length}/{maxSelections} tickers
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-md">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Added Tags */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Your Stocks ({tags.length})</span>
            <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-700 underline">
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Tag key={`${tag}-${index}`} label={tag} variant="removable" onRemove={() => removeTag(tag)} />
            ))}
          </div>
        </div>
      )}
      {/* Save button */}
      <div>
        <Button onClick={onSaveButtonClicked} variant="default">Save Preferences</Button>
      </div>
      {/* Instructions */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
        <p className="font-medium mb-1">How to use:</p>
        <ul className="space-y-1">
          <li>• Type at least {minCharacters} characters</li>
          <li>• Press Enter or click + to add</li>
          <li>• Click × on tickers to remove them</li>
          <li>• Maximum {maxSelections} tickers allowed</li>
        </ul>
      </div>
    </div>
  )
}


"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2 } from "lucide-react"
import { useCompletion } from "ai/react"

interface AISuggestPopoverProps {
  onSelect: (text: string) => void
}

const tones = ["casual", "professional", "witty"] as const
type Tone = (typeof tones)[number]

export function AISuggestPopover({ onSelect }: AISuggestPopoverProps) {
  const [open, setOpen] = useState(false)
  const [tone, setTone] = useState<Tone>("casual")
  const [context, setContext] = useState("")

  const { complete, completion, isLoading } = useCompletion({
    api: "/api/social/ai-suggest",
  })

  const suggestions = completion
    ? completion.split("---").map((s) => s.trim()).filter(Boolean)
    : []

  function handleGenerate() {
    complete(context || "Generate a post caption for me", { body: { tone } })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Sparkles className="size-3.5" />
          AI Suggest
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-4" align="start">
        <div>
          <p className="text-sm font-semibold mb-2">What's your post about?</p>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. just finished a 5k run"
            rows={2}
            className="text-sm"
          />
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Tone</p>
          <div className="flex gap-2">
            {tones.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors capitalize ${
                  tone === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-3.5 animate-spin mr-1.5" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="size-3.5 mr-1.5" />
              Generate suggestions
            </>
          )}
        </Button>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="p-2 rounded-md border text-sm bg-muted/50 group relative">
                <p className="pr-16">{s}</p>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(s)
                    setOpen(false)
                  }}
                  className="absolute right-2 top-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                >
                  Use this
                </button>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

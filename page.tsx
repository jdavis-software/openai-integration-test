'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/loading-spinner'
import { useToast } from "@/components/ui/use-toast"

export default function ComponentBuilder() {
  const [prompt, setPrompt] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Create form data
      const formData = new FormData()
      formData.append('prompt', prompt)
      if (files) {
        Array.from(files).forEach(file => {
          formData.append('files', file)
        })
      }

      // Generate component
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      })
      
      const generateResponseText = await generateResponse.text()
      let generateData

      try {
        generateData = JSON.parse(generateResponseText)
      } catch (parseError) {
        console.error('Failed to parse generate response:', generateResponseText)
        throw new Error(`Invalid response from generate API: ${generateResponseText}`)
      }

      if (!generateResponse.ok) {
        throw new Error(generateData.error || 'Failed to generate component')
      }
      
      if (!generateData.code) {
        throw new Error('No code was generated')
      }

      // Create StackBlitz project
      const stackblitzResponse = await fetch('/api/stackblitz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: generateData.code }),
      })
      
      const stackblitzResponseText = await stackblitzResponse.text()
      let stackblitzData

      try {
        stackblitzData = JSON.parse(stackblitzResponseText)
      } catch (parseError) {
        console.error('Failed to parse StackBlitz response:', stackblitzResponseText)
        throw new Error(`Invalid response from StackBlitz API: ${stackblitzResponseText}`)
      }

      if (!stackblitzResponse.ok) {
        throw new Error(stackblitzData.error || 'Failed to create StackBlitz project')
      }
      
      if (!stackblitzData.url) {
        throw new Error('No project URL received from StackBlitz')
      }

      // Open StackBlitz project in new window
      window.open(stackblitzData.url, '_blank')
      
      // Reset form
      setPrompt('')
      setFiles(null)
      toast({
        title: "Success!",
        description: "Component generated and opened in StackBlitz",
      })
    } catch (err) {
      console.error('Error:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>AI Component Builder</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Component Description</label>
              <Textarea
                placeholder="Describe the component you want to build..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Design Files (Optional)</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="text-sm text-gray-500">
                      {files ? `${files.length} files selected` : 'Drop files here or click to upload'}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                  />
                </label>
              </div>
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <LoadingSpinner /> : 'Generate Component'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}


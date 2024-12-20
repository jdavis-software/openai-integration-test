import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const formData = await req.formData()
    const prompt = formData.get('prompt')
    const files = formData.getAll('files') as File[]

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    // Convert files to base64 for OpenAI
    const filePromises = files.map(async (file) => {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return {
        name: file.name,
        content: base64,
        type: file.type
      }
    })

    const processedFiles = await Promise.all(filePromises)

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a React component generator. Generate clean, modern React components using TypeScript and modern best practices."
        },
        {
          role: "user",
          content: `Create a React component based on this prompt: ${prompt}. ${
            processedFiles.length > 0 
              ? `Additional files for reference: ${JSON.stringify(processedFiles)}`
              : ''
          }`
        }
      ]
    })

    const generatedCode = completion.choices[0]?.message?.content

    if (!generatedCode) {
      throw new Error('No code was generated')
    }

    // Extract code block from markdown if present
    const codeBlockMatch = generatedCode.match(/```(?:tsx|jsx)?\n([\s\S]*?)```/)
    const code = codeBlockMatch ? codeBlockMatch[1] : generatedCode

    return Response.json({ code })
  } catch (error) {
    console.error('Generate API Error:', error)
    return Response.json(
      { 
        error: 'Failed to generate component',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


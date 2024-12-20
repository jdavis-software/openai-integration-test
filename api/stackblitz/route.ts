import { Project } from '@stackblitz/sdk'

export async function POST(req: Request) {
  try {
    if (!process.env.STACKBLITZ_API_KEY) {
      throw new Error('STACKBLITZ_API_KEY is not configured')
    }

    const body = await req.json()
    const code = body.code

    if (!code) {
      throw new Error('No code provided')
    }
    
    const project: Project = {
      files: {
        'src/App.tsx': code,
        'src/index.tsx': `
          import React from 'react';
          import ReactDOM from 'react-dom/client';
          import App from './App';
          import './styles.css';
          
          const root = ReactDOM.createRoot(document.getElementById('root')!);
          root.render(
            <React.StrictMode>
              <App />
            </React.StrictMode>
          );
        `,
        'src/styles.css': `
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
          }
        `,
        'package.json': JSON.stringify({
          name: "generated-component",
          version: "0.0.0",
          private: true,
          dependencies: {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "@types/react": "^18.2.0",
            "@types/react-dom": "^18.2.0"
          },
          scripts: {
            "start": "react-scripts start",
            "build": "react-scripts build"
          }
        }, null, 2)
      },
      title: 'Generated Component',
      description: 'Component generated with AI',
      template: 'create-react-app'
    }

    const response = await fetch('https://api.stackblitz.com/v1/project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STACKBLITZ_API_KEY}`
      },
      body: JSON.stringify(project)
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse StackBlitz response:', responseText)
      throw new Error(`Invalid response from StackBlitz: ${responseText}`)
    }

    if (!response.ok) {
      throw new Error(`StackBlitz API error: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`)
    }

    if (!responseData.url) {
      throw new Error('No project URL received from StackBlitz')
    }

    return Response.json({ url: responseData.url })
  } catch (error) {
    console.error('StackBlitz API Error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create StackBlitz project' },
      { status: 500 }
    )
  }
}


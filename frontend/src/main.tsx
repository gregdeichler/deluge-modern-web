import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// NOTE: no global refetchInterval — each query opts into polling explicitly.
// (A global interval made the Settings modal refetch config every 1.5s and
// clobber unsaved edits.)
const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><QueryClientProvider client={qc}><App/></QueryClientProvider></React.StrictMode>
)

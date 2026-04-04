import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

// TanStack Query client — manages all server state
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Retry failed requests once before showing error
      retry: 1,
      // Don't refetch when window regains focus (can be annoying)
      refetchOnWindowFocus: false,
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f9fafb'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f9fafb'
            }
          }
        }}
      />
    </QueryClientProvider>
  </StrictMode>
)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css';
import { Provider } from 'react-redux'
import { store } from './app/store.js'
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <ThemeProvider>
                <ErrorBoundary>
                    <App />
                    <Toaster />
                </ErrorBoundary>
            </ThemeProvider>
        </Provider>
    </React.StrictMode>,
)
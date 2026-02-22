import './globals.css';
import { Toaster } from '@/components/ui/toaster';
export const metadata = {
    title: 'Calendar | Event View',
    description: 'A clean, minimalist calendar layout optimized for viewing upcoming events with AI conflict detection.',
};
export default function RootLayout({ children, }) {
    return (<html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <div className="fixed inset-0 pointer-eventsvalue-none noir-gradient opacity-50 z-0"/>
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
        <Toaster />
      </body>
    </html>);
}

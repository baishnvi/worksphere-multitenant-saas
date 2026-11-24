import './globals.css';
import { AuthProvider } from '../lib/auth-context';

export const metadata = {
  title: 'WorkSphere - Multi-Tenant Project Management & Workflow Automation',
  description: 'Enterprise multi-tenant project management and workflow platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { GoogleOAuthProvider } from '@react-oauth/google';
import QueryProvider from '../components/QueryProvider';
import NavbarWrapper from '../components/NavbarWrapper';
import Footer from '../components/Footer';
import { LanguageProvider } from '../context/LanguageContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduFlow | Premium E-Learning Course Marketplace',
  description: 'Master in-demand skills in AI, Software Engineering, and Trading with high-fidelity, adaptive streaming courses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1088469592471-mockclientid.apps.googleusercontent.com';

  return (
    <html lang="en" className="min-h-screen">
      <body className="min-h-screen flex flex-col">
        <GoogleOAuthProvider clientId={googleClientId}>
          <LanguageProvider>
            <QueryProvider>
              {/* Conditional Global Header Wrapper */}
              <NavbarWrapper />
              <main className="flex-grow flex flex-col bg-brand-white">
                {children}
              </main>
              <Footer />
            </QueryProvider>
          </LanguageProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}

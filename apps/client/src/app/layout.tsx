import type { Metadata } from 'next';
import { Inter, Noto_Sans_Devanagari } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { StoreProvider } from '@/providers/store-provider';
import { LanguageProvider } from '@/providers/language-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-noto',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'DukaanSathi - Smart Inventory for Kirana Stores',
  description: 'Simple inventory management and demand prediction for small retail stores. Easy to use in English and Hindi.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${notoDevanagari.variable} font-sans`}>
        <QueryProvider>
          <LanguageProvider>
            <AuthProvider>
              <StoreProvider>
                {children}
                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      borderRadius: '12px',
                      padding: '12px 20px',
                      fontSize: '15px',
                      fontWeight: '500',
                    },
                  }}
                />
              </StoreProvider>
            </AuthProvider>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

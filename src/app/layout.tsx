import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedShell } from "@/components/auth/ProtectedShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "DUCA-BOT | Operaciones aduaneras",
  description: "Automatización y control de declaraciones DUCA-T",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ProtectedShell>{children}</ProtectedShell>
        </AuthProvider>
      </body>
    </html>
  );
}

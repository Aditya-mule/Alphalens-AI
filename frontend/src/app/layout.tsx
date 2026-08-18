import "./globals.css";
import React from "react";

export const metadata = {
  title: "AlphaLens AI | Investment Research Platform",
  description: "Enterprise-grade AI-powered stock screener, fundamental analyzer, and RAG company chat",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}

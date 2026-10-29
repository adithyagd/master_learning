import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E2E Procurement Pvt Ltd — Recruiter Academy & Operations",
  description:
    "Enterprise talent acquisition academy, recruiter certification, and recruitment operations workspace by E2E Procurement Private Limited.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-navy-900 antialiased selection:bg-brand-100 selection:text-brand-900">
        {children}
      </body>
    </html>
  );
}

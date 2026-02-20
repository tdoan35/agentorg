import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CopilotKit } from "@copilotkit/react-core";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TitleBar } from "@/components/layout/TitleBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentOrg",
  description: "Personal Business Agent Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--bg-primary)] text-white`}
      >
        <CopilotKit runtimeUrl="/api/copilotkit">
          <TooltipProvider>
            <div className="flex flex-col h-screen">
              <TitleBar />
              <main className="flex-1 overflow-hidden">{children}</main>
            </div>
          </TooltipProvider>
        </CopilotKit>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Rubik, Jersey_25, Caveat } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SetupNeeded } from "@/components/setup-needed";
import { storageHealthy } from "@/lib/db";
import { ROUND_SCHEDULE } from "@/lib/schedule";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jersey = Jersey_25({
  variable: "--font-jersey",
  subsets: ["latin"],
  weight: ["400"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Brewed | Your coffee chat matchmaker",
  description: `Brewed matches you with one person worth talking to every week. No cold DMs, no networking events, no swiping. One intro, one conversation, every ${ROUND_SCHEDULE.sendsDay}.`,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // One check for the whole app: without storage, every route would fail
  // somewhere less legible than here.
  const ready = await storageHealthy();
  return (
    <html
      lang="en"
      className={`${rubik.variable} ${jersey.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        {ready ? children : <SetupNeeded />}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

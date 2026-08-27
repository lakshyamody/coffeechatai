import type { Metadata } from "next";
import { Archivo_Black, Caveat, DM_Sans, Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { SetupNeeded } from "@/components/setup-needed";
import { SiteBackdrop } from "@/components/site/background-video";
import { storageHealthy } from "@/lib/db";
import { ROUND_LABELS } from "@/lib/schedule";
import "./globals.css";

const headline = Instrument_Serif({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const logoFace = Archivo_Black({
  variable: "--font-logo-face",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/* The chunky handwritten digits the countdown runs in. */
const cuteCat = localFont({
  src: "./fonts/CuteCat.otf",
  variable: "--font-cutecat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crashh | Coffee with people who'll change you",
  description: `Crashh matches you with people from the rooms that make the world — one coffee chat a week that can change who you become. No cold DMs, no swiping. One intro every ${ROUND_LABELS.sendsDay}.`,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // One check for the whole app: without storage, every route would fail
  // somewhere less legible than here.
  const ready = await storageHealthy();
  return (
    <html
      lang="en"
      className={`${headline.variable} ${dmSans.variable} ${caveat.variable} ${logoFace.variable} ${cuteCat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <SiteBackdrop />
        {ready ? children : <SetupNeeded />}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

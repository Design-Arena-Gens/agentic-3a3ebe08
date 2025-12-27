import "@/app/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Day-to-Day Agent",
  description: "A personal command center to orchestrate your daily life."
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

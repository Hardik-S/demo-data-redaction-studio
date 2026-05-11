import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Demo Data Redaction Studio",
  description: "Privacy-aware fixture redaction workflow for public portfolio demos."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

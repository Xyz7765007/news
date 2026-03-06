import "./globals.css";

export const metadata = {
  title: "SignalScope — AI Signal Intelligence Engine",
  description:
    "Track company news signals and automatically generate prioritized sales tasks with AI-powered classification.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

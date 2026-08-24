import type { Metadata } from "next";

import "./globals.css";

const themeInitializationScript = `
  (function () {
    try {
      var savedTheme = localStorage.getItem("portal-theme");
      var useDarkTheme = savedTheme === "dark" ||
        (savedTheme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", useDarkTheme);
      document.documentElement.style.colorScheme = useDarkTheme ? "dark" : "light";
    } catch (error) {}
  })();
`;

export const metadata: Metadata = {
  title: "Service Operations Portal",
  description: "Secure operations portal for internal teams and client companies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

import './globals.css';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body><main className="mx-auto max-w-6xl p-6">{children}</main></body>
    </html>
  );
}

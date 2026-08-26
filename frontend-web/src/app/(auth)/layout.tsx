import '../styles/globals.css'; // Eğer CSS dosyan app klasöründeyse bu yol çalışır

export const metadata = {
  title: 'Login - Blog Template',
  description: 'Authentication pages',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center">
        {/* Auth sayfalarında Navbar veya Footer yok, sadece sayfanın kendisi var */}
        {children}
      </body>
    </html>
  );
}
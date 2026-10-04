import '../styles/globals.css';

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center w-full">
      {/* Navbar veya Footer yok, sadece auth sayfalarının içeriği var */}
      {children}
    </div>
  );
}
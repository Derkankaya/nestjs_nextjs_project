export const metadata = {
  title: 'Privacy Policy - Blog Template',
  description: 'Our privacy policy and terms of service.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-6">Last updated: August 2026</p>
          
          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-slate-600 mb-6">We collect information that you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>
          
          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. How We Use Information</h2>
          <p className="text-slate-600 mb-6">We may use the information we collect about you to provide, maintain, and improve our services, including, for example, to facilitate payments, send receipts, provide products and services you request, and develop new features.</p>
          
          <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Sharing of Information</h2>
          <p className="text-slate-600 mb-6">We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including with third-party service providers.</p>
        </div>
      </div>
    </div>
  );
}
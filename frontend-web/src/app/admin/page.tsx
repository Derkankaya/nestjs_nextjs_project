import { FileText, Users, Eye, MessageSquare } from 'lucide-react';

export default function AdminDashboardPage() {
  // Mock stats - will be replaced with real API calls later
  const stats = [
    {
      name: 'Total Posts',
      value: '42',
      icon: FileText,
      color: 'bg-blue-500',
      trend: '+5 this week',
    },
    {
      name: 'Total Views',
      value: '12.5K',
      icon: Eye,
      color: 'bg-green-500',
      trend: '+23% this month',
    },
    {
      name: 'Total Comments',
      value: '156',
      icon: MessageSquare,
      color: 'bg-purple-500',
      trend: '-12% this week',
    },
    {
      name: 'Total Users',
      value: '289',
      icon: Users,
      color: 'bg-orange-500',
      trend: '+18 this month',
    },
  ];

  const recentPosts = [
    {
      id: '1',
      title: 'Getting Started with Next.js 15',
      author: 'John Doe',
      views: '2.3K',
      status: 'Published',
      date: '2 hours ago',
    },
    {
      id: '2',
      title: 'Understanding React Server Components',
      author: 'Jane Smith',
      views: '1.8K',
      status: 'Published',
      date: '5 hours ago',
    },
    {
      id: '3',
      title: 'Mastering TypeScript Generics',
      author: 'Bob Wilson',
      views: '956',
      status: 'Draft',
      date: '1 day ago',
    },
    {
      id: '4',
      title: 'Building Accessible Web Applications',
      author: 'Alice Brown',
      views: '3.2K',
      status: 'Published',
      date: '2 days ago',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">{stat.trend}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Posts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Posts</h2>
            <a href="/admin/posts" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              View All
            </a>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-start justify-between pb-4 last:pb-0 border-b border-slate-100 last:border-0">
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1">{post.title}</h3>
                    <div className="flex items-center space-x-3 text-sm text-slate-500">
                      <span>{post.author}</span>
                      <span>•</span>
                      <span>{post.views} views</span>
                      <span>•</span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      post.status === 'Published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Comments */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Comments</h2>
            <a href="/admin/comments" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              View All
            </a>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                  JD
                </div>
                <div>
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">John Doe</span> commented on "Next.js 15"
                  </p>
                  <p className="text-sm text-slate-500 mt-1">"Great explanation of the new features!"</p>
                  <p className="text-xs text-slate-400 mt-2">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
                  AS
                </div>
                <div>
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">Alice Smith</span> commented on "TypeScript"
                  </p>
                  <p className="text-sm text-slate-500 mt-1">"This helped me understand generics better."</p>
                  <p className="text-xs text-slate-400 mt-2">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
                  RW
                </div>
                <div>
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">Robert Wilson</span> commented on "Accessibility"
                  </p>
                  <p className="text-sm text-slate-500 mt-1">"Very comprehensive guide, thanks for sharing!"</p>
                  <p className="text-xs text-slate-400 mt-2">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

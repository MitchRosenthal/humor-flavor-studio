import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: flavorCount },
    { count: stepCount },
    { count: captionCount },
  ] = await Promise.all([
    supabase.from("humor_flavors").select("*", { count: "exact", head: true }),
    supabase.from("humor_flavor_steps").select("*", { count: "exact", head: true }),
    supabase.from("captions").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Humor Flavors", value: flavorCount ?? 0, icon: "🎭", href: "/dashboard/flavors" },
    { label: "Steps Total", value: stepCount ?? 0, icon: "🔗", href: "/dashboard/flavors" },
    { label: "Captions Generated", value: (captionCount ?? 0).toLocaleString(), icon: "💬", href: "/dashboard/captions" },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Manage humor flavors, steps, and test prompt chains
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {stats.map((stat) => (
          <a
            key={stat.label}
            href={stat.href}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
          </a>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/dashboard/flavors"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-2xl">🎭</span>
            <div>
              <div className="font-medium text-gray-900 dark:text-white text-sm">Manage Flavors</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Create, edit, delete humor flavors and steps</div>
            </div>
          </a>
          <a
            href="/dashboard/test"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-2xl">🧪</span>
            <div>
              <div className="font-medium text-gray-900 dark:text-white text-sm">Test a Flavor</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Generate captions using the REST API</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

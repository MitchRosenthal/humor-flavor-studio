import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_superadmin, is_matrix_admin, email")
    .eq("id", user.id)
    .single();

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
    redirect("/login?error=unauthorized");
  }

  const navGroups = [
    {
      label: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
      ],
    },
    {
      label: "Flavors",
      items: [
        { href: "/dashboard/flavors", label: "Humor Flavors", icon: "🎭" },
      ],
    },
    {
      label: "Data",
      items: [
        { href: "/dashboard/captions", label: "Captions", icon: "💬" },
      ],
    },
    {
      label: "Testing",
      items: [
        { href: "/dashboard/test", label: "Test Runner", icon: "🧪" },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🎭</span>
            <span>Flavor Studio</span>
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate">
            {user.email}
          </div>
          {profile?.is_matrix_admin && (
            <span className="mt-1 inline-block text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
              Matrix Admin
            </span>
          )}
          {profile?.is_superadmin && (
            <span className="mt-1 inline-block text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
              Superadmin
            </span>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 space-y-2">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
        {children}
      </main>
    </div>
  );
}

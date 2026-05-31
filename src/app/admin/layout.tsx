
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Warehouse } from "lucide-react";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (isAuthLoading) {
      return; // Wait for the AuthProvider to finish loading.
    }

    const isAuthPage = pathname === '/admin';
    
    if (user && isAdmin) {
      // if user is logged in and is an admin, and they are on the login page
      // redirect them to the dashboard
      if (isAuthPage) {
        router.replace('/admin/dashboard');
      }
      return; // They can stay on any other admin page
    }

    if (!user && !isAuthPage) {
      // if there is no user, and they are not on the login page, redirect to login
      router.replace('/admin');
      return;
    }
    
    if(user && !isAdmin){
      // if there is a user but they are NOT an admin, kick them out of the admin section
        router.replace('/');
        return;
    }

  }, [user, isAdmin, isAuthLoading, router, pathname]);

  // The AuthProvider now handles the main loading screen. This check is a secondary
  // safeguard for the admin section, but the UI for it may not even be visible
  // if the AuthProvider's loading screen is active.
  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  const isAuthPage = pathname === "/admin";
  const showNav = !isAuthLoading && !!user && isAdmin && !isAuthPage;

  return (
    <>
      {showNav && (
        <nav className="fixed top-20 left-0 right-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 md:px-8 flex items-center gap-1 h-11">
            <NavLink href="/admin/dashboard" current={pathname} icon={<LayoutDashboard className="h-4 w-4" />}>
              Catálogo
            </NavLink>
            <NavLink href="/admin/inventario" current={pathname} icon={<Warehouse className="h-4 w-4" />}>
              Inventario
            </NavLink>
          </div>
        </nav>
      )}
      {children}
    </>
  );
}

function NavLink({
  href,
  current,
  icon,
  children,
}: {
  href: string;
  current: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const active = current === href || current.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <AdminLayoutContent>{children}</AdminLayoutContent>
  );
}



"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      return; 
    }

    const isAuthPage = pathname === '/admin';
    const isDashboard = pathname.startsWith('/admin/dashboard');

    if (user && isAdmin) {
      if (isAuthPage) {
        router.replace('/admin/dashboard');
      }
    } else {
      if (isDashboard) {
        router.replace('/admin');
      }
    }
    
  }, [user, isAdmin, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
         <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
         </div>
      </div>
    );
  }
  
  return <>{children}</>;
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

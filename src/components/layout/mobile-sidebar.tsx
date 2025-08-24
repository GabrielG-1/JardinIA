"use client"

import * as React from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useSidebar } from "@/components/ui/sidebar"

export function MobileSidebar({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Sheet>) {
  const { openMobile, setOpenMobile } = useSidebar()

  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
      <SheetContent
        data-sidebar="mobile"
        side="left"
        className="w-[var(--sidebar-width)] p-0"
      >
        {children}
      </SheetContent>
    </Sheet>
  )
}

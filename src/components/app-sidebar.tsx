import {
  LayoutDashboard,
  User,
  ChartColumnBig,
  Settings,
  Wallet
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

export type Page = "dashboard" | "user" | "graph" | "settings"

const items: { title: string; id: Page; icon: any }[] = [
  {
    title: "Dashboard",
    id: "dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "User",
    id: "user",
    icon: User,
  },
  {
    title: "Graph",
    id: "graph",
    icon: ChartColumnBig,
  },
  {
    title: "Settings",
    id: "settings",
    icon: Settings,
  },
]

interface AppSidebarProps {
  activePage: Page
  onPageChange: (page: Page) => void
}

export function AppSidebar({ activePage, onPageChange }: AppSidebarProps) {
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center">
        <div className="flex items-center gap-2 px-2 w-full group-data-[collapsible=icon]:justify-center">
          <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Wallet className="size-4" />
          </div>
          {state === "expanded" && (
            <span className="truncate font-bold text-lg">Mohar</span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    tooltip={item.title} 
                    isActive={activePage === item.id}
                    onClick={() => onPageChange(item.id)}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex items-center justify-center py-4">
        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  )
}

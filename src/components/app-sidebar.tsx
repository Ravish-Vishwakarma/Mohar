import {
  LayoutDashboard,
  ChartColumnBig,
  Settings,
  Wallet,
  Sun,
  Moon
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
import { useTheme } from "./theme-provider"
import { Page } from "@/types"

const items: { title: string; id: Page; icon: any }[] = [
  {
    title: "Dashboard",
    id: "dashboard",
    icon: LayoutDashboard,
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
  const { theme, setTheme } = useTheme()

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
            <SidebarMenu className="gap-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    tooltip={item.title} 
                    isActive={activePage === item.id}
                    onClick={() => onPageChange(item.id)}
                    className={activePage === item.id ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : ""}
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
      <SidebarFooter className="flex flex-col gap-2 p-4 group-data-[collapsible=icon]:p-2 items-center">
        <SidebarMenu>
          <SidebarMenuItem className="w-full">
            <SidebarMenuButton 
              tooltip={`Toggle ${theme === "dark" ? "Light" : "Dark"} Mode`}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              <span>{theme === "dark" ? "Light" : "Dark"} Mode</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  )
}

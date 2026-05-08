import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { BarChart3, Users, Star, AlertTriangle, Settings, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/hooks/useBusiness";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Customers", url: "/dashboard/customers", icon: Users },
  { title: "Reviews", url: "/dashboard/reviews", icon: Star },
  { title: "Complaints", url: "/dashboard/complaints", icon: AlertTriangle, badgeKey: "complaints" },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { data: business } = useBusiness();

  const queryClient = useQueryClient();

  const { data: openComplaints } = useQuery({
    queryKey: ["complaints-count", business?.id],
    queryFn: async () => {
      if (!business) return 0;
      const { count } = await supabase
        .from("complaints")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("status", "new");
      return count ?? 0;
    },
    enabled: !!business,
  });

  useEffect(() => {
    if (!business) return;
    const channel = supabase
      .channel("complaints-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "complaints", filter: `business_id=eq.${business.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["complaints-count", business.id] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [business, queryClient]);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
          <Star className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && <span className="text-sm font-bold text-sidebar-foreground">ReviewFlow</span>}
      </div>
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="flex-1 flex items-center justify-between">
                          {item.title}
                          {item.badgeKey === "complaints" && (openComplaints ?? 0) > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold">
                              {openComplaints}
                            </Badge>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SignOutButton collapsed={collapsed} />
    </Sidebar>
  );
}

function SignOutButton({ collapsed }: { collapsed: boolean }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="mt-auto border-t border-sidebar-border p-2">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={handleSignOut} className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer">
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign Out</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}

const DashboardLayout = () => {
  const { data: business, isLoading } = useBusiness();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !business) {
      navigate("/onboarding");
    }
  }, [isLoading, business, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const initials = business?.business_name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "RF";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur-sm px-4">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {initials}
              </div>
              <span className="hidden text-sm font-medium text-foreground sm:block">{business?.business_name}</span>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;

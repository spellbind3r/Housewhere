import { useState } from "react";
import { Home, Search, Plus, Warehouse, Tags, AlertTriangle, ChevronRight, Building, DoorOpen } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { StorageArea } from "@shared/schema";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Search Items",
    url: "/search",
    icon: Search,
  },
  {
    title: "Storage Areas",
    url: "/storage-areas",
    icon: Warehouse,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  
  const { data: storageAreas = [] } = useQuery<StorageArea[]>({
    queryKey: ["/api/storage-areas"],
  });

  const topLevelAreas = storageAreas.filter((area) => !area.parentId);

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarContent>
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Home className="text-primary-foreground text-sm" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">HomeTrack</h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <div className={cn(
                        "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        location === item.url 
                          ? "text-primary bg-accent" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Storage Hierarchy */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Storage Areas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-1">
              {topLevelAreas.map((area: any) => (
                <StorageAreaNode key={area.id} area={area} level={0} />
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function StorageAreaNode({ area, level }: { area: StorageArea; level: number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: childAreas = [] } = useQuery<StorageArea[]>({
    queryKey: ["/api/storage-areas/parent", area.id],
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "area":
        return Building;
      case "room":
      case "storage_unit":
      case "section":
        return DoorOpen;
      default:
        return DoorOpen;
    }
  };

  const Icon = getIcon(area.type);

  const handleClick = () => {
    if (childAreas.length > 0) {
      setIsExpanded(!isExpanded);
    } else {
      // Navigate to search page filtered by this storage area
      window.location.href = `/search?storageArea=${area.id}`;
    }
  };

  return (
    <div className="text-sm">
      <button
        onClick={handleClick}
        className="flex items-center space-x-2 w-full text-left px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors"
        data-testid={`button-storage-area-${area.id}`}
        style={{ paddingLeft: `${0.75 + level * 1.5}rem` }}
      >
        {childAreas.length > 0 && (
          <ChevronRight
            className={`text-xs w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          />
        )}
        <Icon className="text-xs w-3 h-3" />
        <span>{area.name}</span>
      </button>
      {childAreas.length > 0 && isExpanded && (
        <div className="mt-1 space-y-1">
          {childAreas.map((childArea) => (
            <StorageAreaNode key={childArea.id} area={childArea} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

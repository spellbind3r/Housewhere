import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Building, DoorOpen, Package, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddStorageModal } from "@/components/add-storage-modal";
import type { StorageArea } from "@shared/schema";

export default function StorageAreas() {
  const [isAddStorageModalOpen, setIsAddStorageModalOpen] = useState(false);

  const { data: storageAreas = [] } = useQuery<StorageArea[]>({
    queryKey: ["/api/storage-areas"],
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "area":
        return Building;
      case "room":
        return DoorOpen;
      case "storage_unit":
        return Package;
      case "section":
        return Grid;
      default:
        return Package;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "area":
        return "Area";
      case "room":
        return "Room";
      case "storage_unit":
        return "Storage Unit";
      case "section":
        return "Section";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "area":
        return "bg-primary/10 text-primary";
      case "room":
        return "bg-secondary/10 text-secondary";
      case "storage_unit":
        return "bg-accent/80 text-accent-foreground";
      case "section":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Build hierarchy
  const buildHierarchy = (areas: StorageArea[]) => {
    const areaMap = new Map<string, StorageArea & { children: StorageArea[] }>();
    
    // Initialize all areas with children array
    areas.forEach(area => {
      areaMap.set(area.id, { ...area, children: [] });
    });

    // Build parent-child relationships
    const topLevel: (StorageArea & { children: StorageArea[] })[] = [];
    areas.forEach(area => {
      const areaWithChildren = areaMap.get(area.id)!;
      if (area.parentId) {
        const parent = areaMap.get(area.parentId);
        if (parent) {
          parent.children.push(areaWithChildren);
        }
      } else {
        topLevel.push(areaWithChildren);
      }
    });

    return topLevel;
  };

  const hierarchy = buildHierarchy(storageAreas);

  const renderStorageArea = (area: StorageArea & { children: StorageArea[] }, level = 0) => {
    const Icon = getIcon(area.type);
    
    return (
      <div key={area.id} className="space-y-2">
        <Card className="hover-elevate" style={{ marginLeft: `${level * 1.5}rem` }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="text-primary w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground" data-testid={`text-storage-name-${area.id}`}>
                    {area.name}
                  </h4>
                  {area.description && (
                    <p className="text-sm text-muted-foreground" data-testid={`text-storage-description-${area.id}`}>
                      {area.description}
                    </p>
                  )}
                  <Badge 
                    className={`text-xs mt-1 ${getTypeColor(area.type)}`}
                    data-testid={`badge-storage-type-${area.id}`}
                  >
                    {getTypeLabel(area.type)}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {area.children.length} sub-locations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Render children */}
        {area.children?.map(child => renderStorageArea(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Storage Areas</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage your storage hierarchy</p>
          </div>
          <Button 
            onClick={() => setIsAddStorageModalOpen(true)}
            data-testid="button-add-storage-area"
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Storage Area
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {/* Storage Hierarchy */}
        <div className="space-y-4">
          {hierarchy.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No storage areas found</p>
                <Button 
                  onClick={() => setIsAddStorageModalOpen(true)}
                  data-testid="button-add-first-storage"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Add Your First Storage Area
                </Button>
              </CardContent>
            </Card>
          ) : (
            hierarchy.map((area) => renderStorageArea(area, 0))
          )}
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {storageAreas.filter(a => a.type === "area").length}
              </p>
              <p className="text-sm text-muted-foreground">Areas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {storageAreas.filter(a => a.type === "room").length}
              </p>
              <p className="text-sm text-muted-foreground">Rooms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {storageAreas.filter(a => a.type === "storage_unit").length}
              </p>
              <p className="text-sm text-muted-foreground">Storage Units</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {storageAreas.filter(a => a.type === "section").length}
              </p>
              <p className="text-sm text-muted-foreground">Sections</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Storage Modal */}
      <AddStorageModal 
        isOpen={isAddStorageModalOpen} 
        onClose={() => setIsAddStorageModalOpen(false)} 
      />
    </div>
  );
}

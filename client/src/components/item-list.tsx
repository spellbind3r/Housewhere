import { Edit, Trash2, Box, Wrench, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ItemWithLocation } from "@shared/schema";

interface ItemListProps {
  items: ItemWithLocation[];
}

export function ItemList({ items }: ItemListProps) {
  const getItemIcon = (tags: string[] = []) => {
    if (tags.includes("clothing")) return Box;
    if (tags.includes("tools")) return Wrench;
    if (tags.includes("books")) return BookOpen;
    return Box;
  };

  const formatLocation = (location: any[] = []) => {
    return location.map(area => area.name).join(" → ");
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const itemDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / (24 * 60));
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No items found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const ItemIcon = getItemIcon(item.tags);
        return (
          <div 
            key={item.id} 
            className="flex items-center justify-between p-4 bg-accent rounded-lg hover-elevate"
            data-testid={`item-card-${item.id}`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <ItemIcon className="text-primary w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-foreground" data-testid={`text-item-name-${item.id}`}>
                  {item.name}
                </h4>
                <p className="text-sm text-muted-foreground" data-testid={`text-item-location-${item.id}`}>
                  {formatLocation(item.location) || "No location assigned"}
                </p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex space-x-2 mt-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="text-xs"
                        data-testid={`badge-tag-${tag}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground" data-testid={`text-item-date-${item.id}`}>
                {item.createdAt ? formatTimeAgo(item.createdAt) : "Unknown"}
              </p>
              <div className="flex space-x-2 mt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-testid={`button-edit-${item.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-testid={`button-delete-${item.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

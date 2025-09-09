import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Warehouse, Box, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddItemModal } from "@/components/add-item-modal";
import { AddStorageModal } from "@/components/add-storage-modal";
import { ItemList } from "@/components/item-list";
import type { StorageStats, ItemWithLocation } from "@shared/schema";

export default function Dashboard() {
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddStorageModalOpen, setIsAddStorageModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stats } = useQuery<StorageStats>({
    queryKey: ["/api/stats"],
  });

  const { data: recentItems = [] } = useQuery<ItemWithLocation[]>({
    queryKey: ["/api/items/recent"],
  });

  const { data: tags = [] } = useQuery<string[]>({
    queryKey: ["/api/tags"],
  });

  const popularTags = tags.slice(0, 6);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search page with query
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-1">Track and manage your stored items</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            </form>
            <Button 
              onClick={() => setIsAddItemModalOpen(true)}
              data-testid="button-add-item"
            >
              <Plus className="mr-2 w-4 h-4" />
              Add Item
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-items">
                    {stats?.totalItems || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Box className="text-primary text-xl" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Items in inventory
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Storage Areas</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-storage-areas">
                    {stats?.storageAreas || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Warehouse className="text-secondary text-xl" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Organized locations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recent Additions</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-recent-additions">
                    {stats?.recentAdditions || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Plus className="text-green-600 text-xl" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Missing Items</p>
                  <p className="text-2xl font-bold text-destructive" data-testid="text-missing-items">
                    {stats?.missingItems || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-destructive text-xl" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Recent Items</h3>
                <p className="text-sm text-muted-foreground">Recently added or modified items</p>
              </CardHeader>
              <CardContent className="p-6">
                <ItemList items={recentItems} />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Filters */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-start"
                    onClick={() => setIsAddItemModalOpen(true)}
                    data-testid="button-quick-add-item"
                  >
                    <Plus className="mr-2 w-4 h-4" />
                    Add New Item
                  </Button>
                  <Button 
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => setIsAddStorageModalOpen(true)}
                    data-testid="button-quick-add-storage"
                  >
                    <Warehouse className="mr-2 w-4 h-4" />
                    Add Storage Area
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.location.href = "/search"}
                    data-testid="button-advanced-search"
                  >
                    <Search className="mr-2 w-4 h-4" />
                    Advanced Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Badge 
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => window.location.href = `/search?tag=${encodeURIComponent(tag)}`}
                      data-testid={`button-tag-${tag}`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Missing Items Alert */}
            {stats && stats.missingItems > 0 && (
              <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <AlertTriangle className="text-destructive w-5 h-5" />
                    <h3 className="font-semibold text-destructive">Missing Items</h3>
                  </div>
                  <p className="text-sm text-destructive/80 mb-4">
                    You have {stats.missingItems} items marked as missing that need attention.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = "/search?status=missing"}
                    data-testid="button-view-missing"
                  >
                    Review missing items →
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddItemModal 
        isOpen={isAddItemModalOpen} 
        onClose={() => setIsAddItemModalOpen(false)} 
      />
      <AddStorageModal 
        isOpen={isAddStorageModalOpen} 
        onClose={() => setIsAddStorageModalOpen(false)} 
      />
    </div>
  );
}

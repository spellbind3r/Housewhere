import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ItemList } from "@/components/item-list";
import { EditItemModal } from "@/components/edit-item-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ItemWithLocation, StorageArea } from "@shared/schema";

export default function StorageAreaItems() {
  const [, params] = useRoute("/storage-areas/:id/items");
  const [, setLocation] = useLocation();
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ItemWithLocation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemWithLocation | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const storageAreaId = params?.id || "";

  // Get storage area details
  const { data: storageArea } = useQuery<StorageArea>({
    queryKey: [`/api/storage-areas/${storageAreaId}`],
    enabled: !!storageAreaId,
  });

  // Get items in this storage area
  const { data: items = [], isLoading } = useQuery<ItemWithLocation[]>({
    queryKey: [`/api/items/storage/${storageAreaId}`],
    enabled: !!storageAreaId,
  });

  const handleEditItem = (item: ItemWithLocation) => {
    setItemToEdit(item);
    setIsEditItemModalOpen(true);
  };

  const handleDeleteItem = (item: ItemWithLocation) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: [`/api/items/storage/${storageAreaId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/items/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/search"] });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate(itemToDelete.id);
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

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/storage-areas")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {storageArea?.name || "Loading..."}
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                {storageArea && (
                  <Badge variant="secondary">
                    {getTypeLabel(storageArea.type)}
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground">
                  {items.length} item{items.length !== 1 ? 's' : ''} stored here
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Items</h3>
            {storageArea?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {storageArea.description}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No items stored in this location</p>
              </div>
            ) : (
              <ItemList
                items={items}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={isEditItemModalOpen}
        onClose={() => {
          setIsEditItemModalOpen(false);
          setItemToEdit(null);
        }}
        item={itemToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="!bg-white !text-gray-900 border-2 border-gray-300">
          <AlertDialogHeader>
            <AlertDialogTitle className="!text-gray-900">Delete Item</AlertDialogTitle>
            <AlertDialogDescription className="!text-gray-600">
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteItemMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteItemMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteItemMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

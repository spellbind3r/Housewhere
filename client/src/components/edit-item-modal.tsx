import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertItemSchema, type StorageArea, type ItemWithLocation } from "@shared/schema";

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemWithLocation | null;
}

const formSchema = insertItemSchema.extend({
  tags: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function EditItemModal({ isOpen, onClose, item }: EditItemModalProps) {
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedStorageUnit, setSelectedStorageUnit] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      tags: "",
      storageAreaId: "",
      status: "active",
    },
  });

  // Get all storage areas
  const { data: allStorageAreas = [] } = useQuery<StorageArea[]>({
    queryKey: ["/api/storage-areas"],
  });

  // Update form and dropdowns when item changes
  useEffect(() => {
    if (item && isOpen) {
      form.reset({
        name: item.name,
        description: item.description || "",
        tags: item.tags?.join(", ") || "",
        storageAreaId: item.storageAreaId || "",
        status: item.status,
      });

      // Set up the location hierarchy
      if (item.location && item.location.length > 0) {
        const area = item.location.find(loc => loc.type === "area");
        const room = item.location.find(loc => loc.type === "room");
        const storageUnit = item.location.find(loc => loc.type === "storage_unit");
        const section = item.location.find(loc => loc.type === "section");

        setSelectedArea(area?.id || "");
        setSelectedRoom(room?.id || "");
        setSelectedStorageUnit(storageUnit?.id || "");

        if (section) {
          form.setValue("storageAreaId", section.id);
        } else if (storageUnit) {
          form.setValue("storageAreaId", storageUnit.id);
        } else if (room) {
          form.setValue("storageAreaId", room.id);
        } else if (area) {
          form.setValue("storageAreaId", area.id);
        }
      }
    }
  }, [item, isOpen, form]);

  // Filter areas by type and parent
  const areas = allStorageAreas.filter((area) => area.type === "area");
  const rooms = allStorageAreas.filter((area) =>
    area.type === "room" && area.parentId === selectedArea
  );
  const storageUnits = allStorageAreas.filter((area) =>
    area.type === "storage_unit" && area.parentId === selectedRoom
  );
  const sections = allStorageAreas.filter((area) =>
    area.type === "section" && area.parentId === selectedStorageUnit
  );

  const updateItemMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!item) throw new Error("No item to update");
      return await apiRequest("PATCH", `/api/items/${item.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/search"] });
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Determine the most specific storage area
      let finalStorageAreaId = selectedArea;
      if (selectedRoom) finalStorageAreaId = selectedRoom;
      if (selectedStorageUnit) finalStorageAreaId = selectedStorageUnit;
      if (data.storageAreaId) finalStorageAreaId = data.storageAreaId; // section

      // Parse tags
      const tags = data.tags
        ? data.tags.split(",").map(tag => tag.trim()).filter(Boolean)
        : [];

      const itemData = {
        name: data.name,
        description: data.description || undefined,
        tags: tags.length > 0 ? tags : undefined,
        storageAreaId: finalStorageAreaId || undefined,
        status: data.status,
      };

      updateItemMutation.mutate(itemData);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedArea("");
      setSelectedRoom("");
      setSelectedStorageUnit("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto !bg-white !text-gray-900 border-2 border-gray-300 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="!text-gray-900 text-xl">Edit Item</DialogTitle>
          <DialogDescription className="!text-gray-600">
            Update the item details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Item Basic Info */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter item name"
                        {...field}
                        data-testid="input-item-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a description for this item"
                        rows={3}
                        {...field}
                        value={field.value || ""}
                        data-testid="input-item-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Storage Location */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-gray-900">Storage Location</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel>Area</FormLabel>
                  <Select
                    value={selectedArea}
                    onValueChange={setSelectedArea}
                    data-testid="select-area"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <FormLabel>Room</FormLabel>
                  <Select
                    value={selectedRoom}
                    onValueChange={setSelectedRoom}
                    disabled={!selectedArea}
                    data-testid="select-room"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel>Storage Unit</FormLabel>
                  <Select
                    value={selectedStorageUnit}
                    onValueChange={setSelectedStorageUnit}
                    disabled={!selectedRoom}
                    data-testid="select-storage-unit"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select storage unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {storageUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <FormField
                  control={form.control}
                  name="storageAreaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        disabled={!selectedStorageUnit}
                        data-testid="select-section"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Add tags (comma separated)"
                      {...field}
                      data-testid="input-item-tags"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-600">
                    Separate tags with commas (e.g., clothing, seasonal, winter)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    data-testid="select-status"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="removed">Removed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateItemMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateItemMutation.isPending}
                data-testid="button-submit"
              >
                {updateItemMutation.isPending ? "Updating..." : "Update Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

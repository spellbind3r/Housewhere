import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
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
import { insertItemSchema, type StorageArea } from "@shared/schema";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = insertItemSchema.extend({
  tags: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
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

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Item created successfully",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create item",
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

      createItemMutation.mutate(itemData);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setSelectedArea("");
      setSelectedRoom("");
      setSelectedStorageUnit("");
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border border-card-border shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Add New Item</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Fill in the details to add a new item to your inventory.
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
              <h3 className="text-md font-semibold text-foreground">Storage Location</h3>
              
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
                  <p className="text-xs text-muted-foreground">
                    Separate tags with commas (e.g., clothing, seasonal, winter)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="outline"
                onClick={onClose}
                disabled={createItemMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createItemMutation.isPending}
                data-testid="button-submit"
              >
                {createItemMutation.isPending ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

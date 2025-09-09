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
import { insertStorageAreaSchema, type StorageArea } from "@shared/schema";

interface AddStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = insertStorageAreaSchema;
type FormData = z.infer<typeof formSchema>;

export function AddStorageModal({ isOpen, onClose }: AddStorageModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "area",
      parentId: null,
    },
  });

  const { data: storageAreas = [] } = useQuery<StorageArea[]>({
    queryKey: ["/api/storage-areas"],
  });

  const selectedType = form.watch("type");

  // Filter parent options based on selected type
  const getParentOptions = () => {
    switch (selectedType) {
      case "area":
        return []; // Areas have no parent
      case "room":
        return storageAreas.filter((area) => area.type === "area");
      case "storage_unit":
        return storageAreas.filter((area) => area.type === "room");
      case "section":
        return storageAreas.filter((area) => area.type === "storage_unit");
      default:
        return [];
    }
  };

  const createStorageAreaMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/storage-areas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/storage-areas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Storage area created successfully",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create storage area",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    createStorageAreaMutation.mutate(data);
  };

  const parentOptions = getParentOptions();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Storage Area</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter storage area name" 
                      {...field} 
                      data-testid="input-storage-name"
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
                      placeholder="Add a description (optional)" 
                      rows={3}
                      {...field} 
                      value={field.value || ""}
                      data-testid="input-storage-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    data-testid="select-storage-type"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select storage type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="area">Area (Building/Zone)</SelectItem>
                      <SelectItem value="room">Room</SelectItem>
                      <SelectItem value="storage_unit">Storage Unit (Closet, Cabinet)</SelectItem>
                      <SelectItem value="section">Section (Shelf, Drawer)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {parentOptions.length > 0 && (
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent {selectedType === "room" ? "Area" : 
                                     selectedType === "storage_unit" ? "Room" : 
                                     "Storage Unit"}</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                      value={field.value || "none"}
                      data-testid="select-parent"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No parent</SelectItem>
                        {parentOptions.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="outline"
                onClick={onClose}
                disabled={createStorageAreaMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createStorageAreaMutation.isPending}
                data-testid="button-submit"
              >
                {createStorageAreaMutation.isPending ? "Creating..." : "Create Storage Area"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

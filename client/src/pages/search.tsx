import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Filter, Tag, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ItemList } from "@/components/item-list";
import type { ItemWithLocation } from "@shared/schema";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Get query parameters from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");
    const tag = urlParams.get("tag");
    const status = urlParams.get("status");
    
    if (query) setSearchQuery(query);
    if (tag) setSelectedTag(tag);
    if (status) setSelectedStatus(status);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: tags = [] } = useQuery<string[]>({
    queryKey: ["/api/tags"],
  });

  // Search items based on query
  const { data: searchResults = [], isLoading: isSearching } = useQuery<ItemWithLocation[]>({
    queryKey: ["/api/search", debouncedQuery],
    enabled: debouncedQuery.length > 0,
  });

  // Get items by tag
  const { data: tagResults = [], isLoading: isLoadingTag } = useQuery<ItemWithLocation[]>({
    queryKey: ["/api/items/tag", selectedTag],
    enabled: selectedTag.length > 0 && !debouncedQuery,
  });

  // Get items by status
  const { data: statusResults = [], isLoading: isLoadingStatus } = useQuery<ItemWithLocation[]>({
    queryKey: ["/api/items/status", selectedStatus],
    enabled: selectedStatus.length > 0 && !debouncedQuery && !selectedTag,
  });

  // Determine which results to show
  const getResults = () => {
    if (debouncedQuery) return searchResults;
    if (selectedTag) return tagResults;
    if (selectedStatus) return statusResults;
    return [];
  };

  const results = getResults();
  const isLoading = isSearching || isLoadingTag || isLoadingStatus;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag("");
    setSelectedStatus("");
    setDebouncedQuery("");
    window.history.replaceState({}, '', '/search');
  };

  const hasActiveFilters = debouncedQuery || selectedTag || selectedStatus;

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Search Items</h2>
            <p className="text-sm text-muted-foreground mt-1">Find items by name, description, or tags</p>
          </div>
        </div>
      </header>

      {/* Search Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Search Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                  <Filter className="mr-2 w-5 h-5" />
                  Search & Filter
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-items"
                  />
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                </div>

                {/* Tag Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Filter by Tag</label>
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger data-testid="select-tag-filter">
                      <SelectValue placeholder="Select tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All tags</SelectItem>
                      {tags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Filter by Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="removed">Removed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="w-full"
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                )}

                {/* Popular Tags */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Popular Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 8).map((tag) => (
                      <Badge 
                        key={tag}
                        variant={selectedTag === tag ? "default" : "secondary"}
                        className="cursor-pointer text-xs"
                        onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                        data-testid={`button-popular-tag-${tag}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Search Results
                    {results.length > 0 && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({results.length} item{results.length !== 1 ? 's' : ''} found)
                      </span>
                    )}
                  </h3>
                  {hasActiveFilters && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Filter className="w-4 h-4" />
                      <span>Filters active</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Searching...</p>
                  </div>
                ) : !hasActiveFilters ? (
                  <div className="text-center py-8">
                    <SearchIcon className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Enter a search term or apply filters to find items</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No items found matching your search criteria</p>
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="mt-4"
                      data-testid="button-clear-no-results"
                    >
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <ItemList items={results} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

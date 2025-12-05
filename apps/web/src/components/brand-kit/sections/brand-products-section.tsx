"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BrandKitData } from "../brand-configuration-modal";
import { Package, Plus, X, GripVertical } from "lucide-react";
import { useState } from "react";

interface BrandProductsSectionProps {
  data: BrandKitData;
  onUpdate: (updates: Partial<BrandKitData>) => void;
  disabled?: boolean;
}

export function BrandProductsSection({
  data,
  onUpdate,
  disabled,
}: BrandProductsSectionProps) {
  const [newProduct, setNewProduct] = useState("");
  const products = data.productsServices || [];

  const addProduct = () => {
    const trimmed = newProduct.trim();
    if (!trimmed || products.includes(trimmed)) return;
    
    onUpdate({ productsServices: [...products, trimmed] });
    setNewProduct("");
  };

  const removeProduct = (index: number) => {
    const updated = products.filter((_, i) => i !== index);
    onUpdate({ productsServices: updated.length > 0 ? updated : null });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addProduct();
    }
  };

  return (
    <div className="space-y-8 px-6">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-semibold">Products & Services</h3>
        <p className="sr-only">
          List your key offerings to help AI generate relevant content
        </p>
      </div>

      {/* Add New Product */}
      <div className="space-y-2">
        <Label>Add Product or Service</Label>
        <div className="flex gap-2">
          <Input
            value={newProduct}
            onChange={(e) => setNewProduct(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a product or service name"
            disabled={disabled}
            className="flex-1"
          />
          <Button
            onClick={addProduct}
            disabled={disabled || !newProduct.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Press Enter to add quickly
        </p>
      </div>

      {/* Products List */}
      {products.length > 0 ? (
        <div className="space-y-2">
          <Label>Your Products & Services ({products.length})</Label>
          <div className="rounded-lg border divide-y">
            {products.map((product, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors group"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm">{product}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProduct(index)}
                  disabled={disabled}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl border-2 border-dashed text-center">
          <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No products or services added yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Adding your offerings helps AI understand your business
          </p>
        </div>
      )}

      {/* Tags Preview */}
      {products.length > 0 && (
        <div className="block lg:hidden p-4 rounded-xl border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            Quick View
          </p>
          <div className="flex flex-wrap gap-2">
            {products.map((product, index) => (
              <Badge key={index} variant="secondary">
                {product}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


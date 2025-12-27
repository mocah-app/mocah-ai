"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Download, ExternalLink, FileText, Receipt } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface Invoice {
  id: string;
  number: string;
  date: Date;
  amount: number;
  currency: string;
  status: "paid" | "open" | "uncollectible" | "void" | "draft";
  pdfUrl?: string | null;
  hostedUrl?: string | null;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  isLoading?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

function getStatusBadge(status: Invoice["status"]) {
  switch (status) {
    case "paid":
      return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-0">Paid</Badge>;
    case "open":
      return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-500 border-0">Open</Badge>;
    case "uncollectible":
      return <Badge variant="destructive">Uncollectible</Badge>;
    case "void":
      return <Badge variant="outline">Void</Badge>;
    case "draft":
      return <Badge variant="outline">Draft</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function InvoiceTableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16 ml-auto" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function InvoiceEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed">
      <Receipt className="h-10 w-10 text-muted-foreground/50 mb-4" />
      <p className="text-sm font-medium text-muted-foreground">No invoices yet</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Your invoices will appear here after your first payment
      </p>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function InvoiceTable({ invoices, isLoading }: InvoiceTableProps) {
  if (isLoading) {
    return <InvoiceTableSkeleton />;
  }

  if (!invoices.length) {
    return <InvoiceEmptyState />;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Invoice</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{invoice.number}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(invoice.date)}
              </TableCell>
              <TableCell>
                {getStatusBadge(invoice.status)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatAmount(invoice.amount, invoice.currency)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {invoice.pdfUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {invoice.hostedUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a
                        href={invoice.hostedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View Invoice"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================================
// Compact List Variant (for smaller spaces)
// ============================================================================

interface InvoiceListItemProps {
  invoice: Invoice;
}

export function InvoiceListItem({ invoice }: InvoiceListItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{formatDate(invoice.date)}</p>
          <p className="text-xs text-muted-foreground font-mono">{invoice.number}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {formatAmount(invoice.amount, invoice.currency)}
        </span>
        {getStatusBadge(invoice.status)}
        {invoice.pdfUrl && (
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <a
              href={invoice.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}


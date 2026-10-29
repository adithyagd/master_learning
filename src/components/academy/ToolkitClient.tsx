"use client";

import React, { useState, useMemo } from "react";
import { ToolkitItem, TOOLKIT_CATEGORIES } from "@/lib/toolkit-data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Search,
  Copy,
  Check,
  BookOpen,
  Filter,
  FileText,
  Code2,
  CheckSquare,
  HelpCircle,
  X,
} from "lucide-react";

interface ToolkitClientProps {
  items: ToolkitItem[];
}

export function ToolkitClient({ items }: ToolkitClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered toolkit items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesQuery =
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        (item.copyableText && item.copyableText.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [items, searchQuery, selectedCategory]);

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2500);
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    Checklists: <CheckSquare className="w-3.5 h-3.5" />,
    "Templates & Scripts": <FileText className="w-3.5 h-3.5" />,
    "Boolean Searches": <Code2 className="w-3.5 h-3.5" />,
    "Glossary & Guides": <BookOpen className="w-3.5 h-3.5" />,
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search & Category Pills */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-navy-200/90 shadow-card space-y-4">
        {/* Search input */}
        <div className="relative">
          <Input
            id="toolkit-search"
            placeholder="Search checklists, scripts, boolean strings, screening questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftAddon={<Search className="w-4 h-4 text-navy-400" />}
            rightAddon={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 hover:text-navy-700"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
            className="text-sm py-2.5"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-navy-400 font-semibold flex items-center gap-1 flex-shrink-0 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {TOOLKIT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all select-none flex-shrink-0 ${
                  isSelected
                    ? "bg-brand-600 text-white shadow-xs font-semibold"
                    : "bg-navy-50 text-navy-700 hover:bg-navy-100 hover:text-navy-900 border border-navy-200"
                }`}
              >
                {categoryIcons[cat]}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Metrics */}
      <div className="flex items-center justify-between text-xs text-navy-500 px-1">
        <span>
          Showing <strong>{filteredItems.length}</strong> of {items.length} reference resources
        </span>
        {searchQuery && (
          <span>
            Filtered by keyword: <strong className="text-navy-800">&ldquo;{searchQuery}&rdquo;</strong>
          </span>
        )}
      </div>

      {/* Grid of Toolkit Items */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<HelpCircle className="w-8 h-8 text-navy-400" />}
          title="No Reference Materials Found"
          description={`No tools or templates matched "${searchQuery}". Try searching for synonyms or clear your filters.`}
          actionLabel="Reset All Filters"
          onAction={() => {
            setSearchQuery("");
            setSelectedCategory("All");
          }}
          variant="card"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredItems.map((item) => {
            const isItemCopied = copiedId === item.id;

            return (
              <Card key={item.id} className="flex flex-col justify-between hoverable">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Badge variant="primary" size="sm">
                      {categoryIcons[item.category]}
                      <span className="ml-1">{item.category}</span>
                    </Badge>

                    {item.copyableText && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(item.id, item.copyableText!)}
                        leftIcon={
                          isItemCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )
                        }
                        className={
                          isItemCopied
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : ""
                        }
                      >
                        {isItemCopied ? "Copied Template" : "Copy Template"}
                      </Button>
                    )}
                  </div>

                  <CardTitle className="text-base font-bold text-navy-900 leading-snug">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-navy-500">
                    {item.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Formatted body content */}
                  <div className="text-xs text-navy-800 leading-relaxed bg-navy-50/50 p-4 rounded-xl border border-navy-100 whitespace-pre-line max-h-72 overflow-y-auto">
                    {item.content}
                  </div>

                  {/* Copyable snippet preview box if applicable */}
                  {item.copyableText && (
                    <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto relative">
                      <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-800">
                        <span>Copyable Snippet / Template:</span>
                        <span>Plaintext</span>
                      </div>
                      <pre className="whitespace-pre-wrap leading-relaxed">
                        {item.copyableText}
                      </pre>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex items-center justify-between gap-2 pt-3 pb-3 bg-slate-50/70 border-t border-navy-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-navy-500 bg-white border border-navy-200 px-2 py-0.5 rounded font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {item.copyableText && (
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.copyableText!)}
                      className="text-xs text-brand-600 hover:text-brand-800 font-semibold inline-flex items-center gap-1 flex-shrink-0"
                    >
                      {isItemCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Quick Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

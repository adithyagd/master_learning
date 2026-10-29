import React from "react";
import { ToolkitClient } from "@/components/academy/ToolkitClient";
import { TOOLKIT_ITEMS } from "@/lib/toolkit-data";
import { Badge } from "@/components/ui/Badge";
import { Briefcase } from "lucide-react";

export default function WorkspaceToolkitPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Reference Toolkit</h1>
          <Badge variant="primary" size="sm">
            Operations Library
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Copyable calling scripts, screening questions, boolean search operators, and candidate follow-up templates for daily recruiter operations.
        </p>
      </div>

      <ToolkitClient items={TOOLKIT_ITEMS} />
    </div>
  );
}

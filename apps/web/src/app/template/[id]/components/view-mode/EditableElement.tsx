import React from "react";
import { cn } from "@/lib/utils";
import { useEditorMode } from "../providers/EditorModeProvider";

interface EditableElementProps {
  path: string;
  type: "text" | "image" | "button" | "link" | "container";
  children: React.ReactNode;
  className?: string;
}

export const EditableElement = ({
  path,
  type,
  children,
  className,
}: EditableElementProps) => {
  const { actions, state } = useEditorMode();
  const isSelected = state.selectedElement === path;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    actions.selectElement(path);
  };

  return (
    <div
      className={cn(
        "relative group transition-all duration-200 cursor-pointer",
        isSelected
          ? "ring-2 ring-blue-500 z-10"
          : "hover:ring-1 hover:ring-blue-300",
        className
      )}
      onClick={handleClick}
    >
      {children}

      {/* Label tag on hover/select */}
      <div
        className={cn(
          "absolute -top-5 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-t opacity-0 transition-opacity pointer-events-none",
          isSelected ? "opacity-100" : "group-hover:opacity-100"
        )}
      >
        {type}
      </div>
    </div>
  );
};

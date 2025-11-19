"use client";
import { useParams } from "next/navigation";

const TemplatePage = () => {
  const params = useParams();
  return (
    <div
      className="flex flex-1 flex-col min-h-dvh w-screen bg-dot"
    >
      <div className="flex items-center justify-center bg-background/40 dark:bg-background/85 flex-1 flex-col gap-4 p-4 border border-border">
        <p className="text-2xl font-bold">Template Canvas {params.id}</p>
      </div>
    </div>
  );
};

export default TemplatePage;

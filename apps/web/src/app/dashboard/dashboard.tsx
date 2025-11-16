"use client";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Template {
  id: number;
  name: string;
}

const TEMPLATES: Template[] = [
  {
    id: 1,
    name: "Template 1",
  },
  {
    id: 2,
    name: "Template 2",
  },
  {
    id: 3,
    name: "Template 3",
  },
  {
    id: 4,
    name: "Template 4",
  },
];

const TemplateCard = ({
  template,
}: {
  template: (typeof TEMPLATES)[number];
}) => {
  return (
    <Link href={`/template/${template.id}`}>
      <Card className="gap-0">
        <CardHeader>
          <CardTitle className="group-hover:text-primary transition-all duration-300">
            {template.name}
          </CardTitle>
        </CardHeader>
      </Card>
    </Link>
  );
};

const TemplateList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {TEMPLATES.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
};
export default function Dashboard() {
  return (
    <>
      <TemplateList />
    </>
  );
}

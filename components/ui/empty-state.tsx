import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actionHref = "/evaluacion"
}: {
  title: string;
  description: string;
  actionHref?: string;
}) {
  return (
    <Card className="mx-auto max-w-2xl text-center">
      <p className="font-serif text-3xl font-semibold text-slate-950 dark:text-slate-50">{title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      <div className="mt-6">
        <Link href={actionHref}>
          <Button>Ir a la evaluación</Button>
        </Link>
      </div>
    </Card>
  );
}

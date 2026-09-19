import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <Card>
      <EmptyState
        icon={<AlertIcon className="h-5 w-5" />}
        title="Page not found"
        description="The section you're looking for doesn't exist or has moved."
        action={
          <Link
            href="/dashboard"
            className="mt-1 inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            Back to Dashboard
          </Link>
        }
      />
    </Card>
  );
}

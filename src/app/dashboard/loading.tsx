import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";

export default function DashboardLoading() {
  return (
    <Card>
      <LoadingState rows={6} />
    </Card>
  );
}

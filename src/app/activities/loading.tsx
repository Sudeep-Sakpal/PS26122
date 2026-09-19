import { Card } from "@/components/ui/Card";
import { TableLoadingState } from "@/components/ui/LoadingState";

export default function ActivitiesLoading() {
  return (
    <Card>
      <TableLoadingState rows={8} />
    </Card>
  );
}

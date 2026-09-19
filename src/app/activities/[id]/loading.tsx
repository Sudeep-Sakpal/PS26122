import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";

export default function ActivityDetailLoading() {
  return (
    <Card>
      <LoadingState rows={5} />
    </Card>
  );
}

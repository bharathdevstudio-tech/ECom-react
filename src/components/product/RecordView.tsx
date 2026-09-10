import { useEffect } from "react";

export default function RecordView({ productId }: { productId: string }) {
  useEffect(() => {
    fetch(`/api/recent-views/${productId}`, { method: "POST" }).catch(() => {
      // Recording a view is best-effort.
    });
  }, [productId]);

  return null;
}

import type { Metadata } from "next";

import { ReviewsPage } from "@/features/admin/components/reviews/ReviewsPage";

export const metadata: Metadata = {
  title: "Review & Corrections",
};

export default function AdminReviewsRoute() {
  return <ReviewsPage />;
}

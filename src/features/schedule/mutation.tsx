"use client";

import type { BookingChange } from "@/lib/schedule";
import { useMutation } from "@/features/workspace/mutation";
import { submitBooking } from "./actions";

export { MutationFeedback as BookingFeedback } from "@/features/workspace/mutation";

export function useBookingMutation() {
  return useMutation<BookingChange>(submitBooking);
}

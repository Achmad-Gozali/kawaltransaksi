"use client";

import { useEffect, useRef } from "react";
import { subscribeReportStream, type ReportStreamEvent } from "./reportStream";

/**
 * Panggil `onEvent` tiap kali ada event realtime laporan. Callback boleh
 * berganti tiap render tanpa memicu subscribe/unsubscribe ulang.
 */
export function useReportStream(onEvent: (event: ReportStreamEvent) => void): void {
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  });

  useEffect(() => {
    return subscribeReportStream((event) => handlerRef.current(event));
  }, []);
}

interface Window {
  gtag: (
    command: "event",
    action: string,
    params: {
      event_category: string;
      event_label: string;
      [key: string]: any;
    }
  ) => void;
}

declare function gtag(
  command: "event",
  action: string,
  params: {
    event_category: string;
    event_label: string;
    [key: string]: any;
  }
): void;

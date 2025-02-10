export const trackEvent = (
  action: string,
  params: {
    event_category: string;
    event_label: string;
    [key: string]: any;
  }
) => {
  if (typeof gtag !== "undefined") {
    gtag("event", action, params);
  }
};

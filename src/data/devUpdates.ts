export type DevUpdateNotification = {
  id: string;
  title: string;
  body: string;
  tag: string;
  date: string;
};

export const devUpdateNotifications: DevUpdateNotification[] = [
  {
    id: "dev-radio-loading-screen",
    title: "Radio loading screen",
    body: "Radio now shows a clearer Loading... bar while the station and first track prepare, and hides the queue/list rail until playback is ready.",
    tag: "Radio update",
    date: "2026-07-06",
  },
  {
    id: "dev-july-overhaul",
    title: "Site overhaul",
    body: "New pages (About, FAQ, Contact, Privacy, Terms, DMCA, Updates), curated playlists, visual era timeline, category and era filtering on Songs, service worker audio caching, red accent scheme, and queue/shuffle fixes.",
    tag: "Major update",
    date: "2026-07-02",
  },
  {
    id: "dev-june-feature-polish-drop",
    title: "Feature and polish update",
    body: "Timed comments, radio playback, live lyrics, smoother sliders, refreshed sign-in, full-frame rotating hero photos, notification center, and cleaner player UI.",
    tag: "Major update",
    date: "2026-06-06",
  },
];

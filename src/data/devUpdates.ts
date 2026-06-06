export type DevUpdateNotification = {
  id: string;
  title: string;
  body: string;
  tag: string;
  date: string;
};

export const devUpdateNotifications: DevUpdateNotification[] = [
  {
    id: 'dev-june-feature-polish-drop',
    title: 'Feature and polish update',
    body: 'Timed comments, radio playback, live lyrics, smoother sliders, refreshed sign-in, full-frame rotating hero photos, notification center, and cleaner player UI.',
    tag: 'Major update',
    date: '2026-06-06',
  },
];

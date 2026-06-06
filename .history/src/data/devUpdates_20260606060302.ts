export type DevUpdateNotification = {
  id: string;
  title: string;
  body: string;
  tag: string;
  date: string;
};

export const devUpdateNotifications: DevUpdateNotification[] = [
  {
    id: 'dev-june-launch-polish-drop',
    title: 'Player, community, and launch polish',
    body: 'Timed comments, radio functionality, auth profiles, full-frame rotating hero photos, and a cleaner sign-in flow.',
    tag: 'Major update',
    date: '2026-06-06',
  },
];

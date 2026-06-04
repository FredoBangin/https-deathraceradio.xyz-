const ERA_DESCRIPTIONS: Record<string, string> = {
  jute: 'Early sessions and raw melodic cuts from the first wave of the archive.',
  lnd: 'Tracks connected to the Legends Never Die period and its surrounding sessions.',
  afflictions: 'Moody, darker records grouped around the Afflictions recording run.',
  'hih 999': 'High-energy early-era tracks with the loose 999 sound.',
  'jw 999': 'Foundational Juice WRLD material from the early catalog.',
  bdm: 'Records tied to the Bad Boy and surrounding studio period.',
  nd: 'No Date-era material where sessions are less clearly pinned down.',
  'gb&gr': 'Goodbye & Good Riddance era tracks, leaks, and related sessions.',
  wod: 'WRLD on Drugs era cuts and collaborative session material.',
  drfl: 'Death Race for Love era records and surrounding studio work.',
  out: 'Outsiders-era tracks from one of the most active archive periods.',
  post: 'Posthumous-era material organized after the main recording runs.',
  tpp: 'The Party Never Ends era records and related tracklist candidates.',
  'tpp (ee)': 'Extended-edition material connected to The Party Never Ends.',
  fd: 'Fighting Demons era songs and nearby sessions.',
  'fd (dde)': 'Deluxe-era Fighting Demons material and alternate grouping.',
  tpne: 'The Party Never Ends vault material and late catalog sequencing.',
  'tpne 2.0': 'The Party Never Ends 2.0 material and newer archive organization.',
  'lnd (5yae)': 'Legends Never Die five-year anniversary era material.',
  mainstream: 'Released and widely circulated tracks from the main catalog.',
};

export const getEraDescription = (eraName?: string) => {
  if (!eraName) return 'Archive tracks grouped by recording period and catalog context.';
  return ERA_DESCRIPTIONS[eraName.trim().toLowerCase()]
    || `${eraName} tracks grouped by recording period, metadata, and archive context.`;
};

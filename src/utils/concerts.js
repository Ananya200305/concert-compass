export const fetchConcertsForPinnedArtists = async (list, ticketmasterKey) => {
  const results = [];

  for (const artist of list) {
    try {
      const res = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${ticketmasterKey}&keyword=${encodeURIComponent(
          artist.name
        )}&classificationName=music`
      );
      const data = await res.json();

      if (data._embedded?.events?.length > 0) {
        const events = data._embedded.events.map((event) => ({
          id: event.id,
          name: event.name,
          url: event.url,
          date: event.dates.start.localDate,
          time: event.dates.start.localTime,
          venue: event._embedded?.venues?.[0]?.name || 'Unknown Venue',
          country: event._embedded?.venues?.[0]?.country?.name || 'Unknown Country',
          image: event.images?.[0]?.url || null,
        }));

        results.push({ artist: artist.name, events });
      }
    } catch (err) {
      console.error(`Failed to fetch concerts for ${artist.name}`, err);
    }
  }

  return results;
};

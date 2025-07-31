export const getTopArtists = async (token) => {
  try {
    const res = await fetch('https://api.spotify.com/v1/me/top/artists?limit=5', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      console.warn('Token expired or unauthorized.');
      chrome.storage.local.remove('spotifyToken');
      return null;
    }

    const data = await res.json();

    if (!data?.items) return [];

    const artists = data.items.map((artist) => ({
      name: artist.name,
      image: artist.images?.[0]?.url || null,
    }));

    chrome.storage.local.set({ topArtists: artists });

    return artists;
  } catch (err) {
    console.error('Top artists fetch failed:', err);
    return [];
  }
};

import React, { useEffect, useState } from 'react';

export default function App() {
  const [token, setToken] = useState(null);
  const [topArtists, setTopArtists] = useState([]);
  const [redirectUri, setRedirectUri] = useState('');
  const [pinnedArtist, setPinnedArtist] = useState([])
  const [loading, setLoading] = useState(false)
  const [artistInput, setArtistInput] = useState("");
  const [searchError, setSearchError] = useState(null);

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  console.log("Client ID:", clientId);
  console.log("Redirect URI:", redirectUri);

  const scopes = ['user-top-read', 'user-read-private', 'user-read-email'];

  useEffect(() => {
    if (chrome?.runtime?.id) {
      setRedirectUri(`https://${chrome.runtime.id}.chromiumapp.org/`);
    }
  }, []);

  const loginWithSpotify = () => {
    
    if (!redirectUri) return;

    setLoading(true)

    const authUrl =
      `https://accounts.spotify.com/authorize` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` + 
      `&show_dialog=true`;

      console.log(authUrl)

    chrome.identity.launchWebAuthFlow({
  url: authUrl,
  interactive: true
}, function(redirectUrl) {
  if (chrome.runtime.lastError) {
    console.error("OAuth Error:", chrome.runtime.lastError.message);
    return;
  }

  console.log("Redirect URL received:", redirectUrl);

  // if (!redirectUrl.includes("access_token")) {
  //   console.error("Token not found in redirect");
  //   return;
  // }

 const code = new URLSearchParams(new URL(redirectUrl).search).get("code");

fetch("https://concert-compass-backend.onrender.com/api/token", {  
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    code,
    redirectUri
  })
})
.then(res => res.json())
.then(data => {
  const accessToken = data.access_token;
  chrome.storage.local.set({ spotifyToken: accessToken });
  setToken(accessToken);  // So top artists fetch immediately
})
.catch(error => {
  console.error("Token exchange failed:", error);
})
.finally(() => setLoading(false))

});
};

  // Load token on mount (if saved from earlier session)
  useEffect(() => {
    chrome.storage.local.get('spotifyToken', (result) => {
      if (result.spotifyToken) {
        setToken(result.spotifyToken);
      }
    });

    chrome.storage.local.get('pinnedArtists', (result) => {
      if(result.pinnedArtists){
        setPinnedArtist(result.pinnedArtists)
      }
    })
  }, []);

  //Fetch top artists when token becomes available
  useEffect(() => {
    if (!token) return;

    fetch('https://api.spotify.com/v1/me/top/artists?limit=5', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          console.warn("Token expired or unauthorized.");
          chrome.storage.local.remove('spotifyToken');
          setToken(null);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.items) {
          const artistObjects = data.items.map((artist) => ({
            name: artist.name,
            image: artist.images?.[0]?.url || null,
          }));
          setTopArtists(artistObjects);
          chrome.storage.local.set({ topArtists: artistObjects });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch top artists:", err);
      });
  }, [token]);

  const pinArtist = (artist) => {
  const updatedPins = [...pinnedArtist, artist].filter(
    (a, i, self) => i === self.findIndex((x) => x.name === a.name) // Remove duplicates
  );

  setPinnedArtist(updatedPins);
  chrome.storage.local.set({ pinnedArtists: updatedPins });
};

const unpinArtist = (artist) => {
  const updatedPins = pinnedArtist.filter((a) => a.name !== artist.name);
  const updatedTop = [...topArtists, artist].filter(
    (a, i, self) => i === self.findIndex((x) => x.name === a.name) // remove duplicates
  );

  setPinnedArtist(updatedPins);
  setTopArtists(updatedTop);

  chrome.storage.local.set({
    pinnedArtists: updatedPins,
    topArtists: updatedTop,
  });
};

const searchAndPin = async () => {
  if (!artistInput.trim() || !token) return;

  const query = artistInput.trim();
  setSearchError(null); // reset previous errors

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();
    console.log("Spotify Search Response:", data);

    if (!data.artists || !data.artists.items) {
      setSearchError("Unexpected response from Spotify.");
      return;
    }

    const match = data.artists.items.find(
      (item) => item.name.toLowerCase() === query.toLowerCase()
    );

    if (!match) {
      setSearchError("Artist not found.");
      return;
    }

    const artistData = {
      name: match.name,
      image: match.images?.[0]?.url || null,
    };

    // Avoid duplicates
    if (!pinnedArtist.some((a) => a.name === artistData.name)) {
      const updatedPins = [...pinnedArtist, artistData];
      setPinnedArtist(updatedPins);
      setTopArtists((prev) => prev.filter((a) => a.name !== artistData.name));
      chrome.storage.local.set({ pinnedArtists: updatedPins });
      setArtistInput(""); // clear input
      setSearchError(null); // clear error
    } else {
      setSearchError("Artist already pinned.");
    }

  } catch (error) {
    console.error("Error searching artist:", error);
    setSearchError("Error searching artist.");
  }
};

const removeTopArtist = (artistToRemove) => {
  const updatedTop = topArtists.filter(
    (artist) => artist.name !== artistToRemove.name
  );
  setTopArtists(updatedTop);
  chrome.storage.local.set({ topArtists: updatedTop });
};





  return (
    <div className="w-[350px] min-h-[520px] bg-[#0e0e0e] p-5 text-white rounded-2xl font-sans shadow-lg">
      <h1 className="text-2xl font-bold mb-2 text-center">Concert Compass</h1>

      {!token ? (
        <button
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-2 rounded-full mb-7"
          onClick={loginWithSpotify}
        >
          {loading ? 'Connecting...' : 'Connect to Spotify'}
        </button>
      ) : (
        <p className="text-center text-sm text-pink-400 mb-6">
          Connected to Spotify
        </p>
      )}

      <div className="flex mb-6 bg-white/10 rounded-full p-2">
      <div className="relative flex-1">
        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 3 10.5a7.5 7.5 0 0 0 13.65 6.15z" />
          </svg>
        </span>
        <input
          type="text"
          value={artistInput}
          onChange={(e) => setArtistInput(e.target.value)}
          placeholder="Add an artist..."
          className="w-full pl-9 pr-3 py-2 rounded-full bg-[#1c1c1c] text-sm text-white focus:outline-none"
        />
      </div>
      <button
  disabled={!artistInput.trim()}
  className={`ml-2 px-4 py-2 text-sm font-semibold rounded-full 
    bg-gradient-to-r from-pink-500 to-purple-600 
    hover:from-pink-600 hover:to-purple-700
    ${!artistInput.trim() ? "opacity-50 cursor-not-allowed" : ""}
  `}
  onClick={searchAndPin}
>
  Add
</button>
      
    </div>

    {searchError && (<p className="text-xs text-red-400 mt-1">{searchError}</p>)}

        <div className="mb-6">
  <h2 className="text-sm font-semibold mb-2">Pinned Artists</h2>
  <div className="bg-[#1a1a1a] rounded-xl p-3 space-y-2 shadow-inner">
    {pinnedArtist.length > 0 ? (
      pinnedArtist.map((artist, idx) => (
        <div key={idx} className="flex items-center justify-between gap-3 text-sm">
  <div className="flex items-center gap-3">
    <img
      src={artist.image || 'https://via.placeholder.com/32/ffffff/aaaaaa?text=🎵'}
      alt={artist.name}
      className="w-8 h-8 rounded-full object-cover"
    />
    <span>{artist.name}</span>
  </div>
  <button
    onClick={() => unpinArtist(artist)}
    className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-full"
  >
    Unpin
  </button>
</div>

      ))
    ) : (
      <div className="bg-[#1a1a1a] rounded-xl p-4 text-sm text-gray-400 flex items-center gap-2 justify-center text-center flex-col">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A6 6 0 0 1 5 6.708V2.277a3 3 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354m1.58 1.408-.002-.001zm-.002-.001.002.001A.5.5 0 0 1 6 2v5a.5.5 0 0 1-.276.447h-.002l-.012.007-.054.03a5 5 0 0 0-.827.58c-.318.278-.585.596-.725.936h7.792c-.14-.34-.407-.658-.725-.936a5 5 0 0 0-.881-.61l-.012-.006h-.002A.5.5 0 0 1 10 7V2a.5.5 0 0 1 .295-.458 1.8 1.8 0 0 0 .351-.271c.08-.08.155-.17.214-.271H5.14q.091.15.214.271a1.8 1.8 0 0 0 .37.282" />
        </svg>
        <p>No pinned artists yet.</p>
        <p className="text-xs">Pin an artist to always see their concert info first.</p>
      </div>
    )}
  </div>
</div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-2">Top Artists</h2>
        <div className='bg-[#1a1a1a] rounded-xl p-3 space-y-2 shadow-inner'>
          {topArtists.length > 0 ? (
            topArtists.map((artist, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
              <img
                src={artist.image || 'https://via.placeholder.com/32/ffffff/aaaaaa?text=🎵'}
                alt={artist.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span>{artist.name}</span>
              <button
              onClick={() => pinArtist(artist)}
              >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={0.5} viewBox="0 0 24 24">
          <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A6 6 0 0 1 5 6.708V2.277a3 3 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354m1.58 1.408-.002-.001zm-.002-.001.002.001A.5.5 0 0 1 6 2v5a.5.5 0 0 1-.276.447h-.002l-.012.007-.054.03a5 5 0 0 0-.827.58c-.318.278-.585.596-.725.936h7.792c-.14-.34-.407-.658-.725-.936a5 5 0 0 0-.881-.61l-.012-.006h-.002A.5.5 0 0 1 10 7V2a.5.5 0 0 1 .295-.458 1.8 1.8 0 0 0 .351-.271c.08-.08.155-.17.214-.271H5.14q.091.15.214.271a1.8 1.8 0 0 0 .37.282" />
        </svg>
            </button>
            <button className='text-xs px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-full' onClick={() => removeTopArtist(artist)}>
              Remove
            </button>
            </div>
            ))
        ) : (
          <p className="text-sm text-gray-400">No top artists yet.</p>
        )}
        </div>
      </div>


      <div>
      <h2 className="text-sm font-semibold mb-2">Concert Info</h2>
      <div className="bg-[#1a1a1a] rounded-xl p-4 text-sm text-gray-400 text-center flex items-center gap-2 justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M12 13c0 1.105-1.12 2-2.5 2S7 14.105 7 13s1.12-2 2.5-2 2.5.895 2.5 2"/>
          <path fill-rule="evenodd" d="M12 3v10h-1V3z"/>
          <path d="M11 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 16 2.22V4l-5 1z"/>
          <path fill-rule="evenodd" d="M0 11.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5m0-4A.5.5 0 0 1 .5 7H8a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5m0-4A.5.5 0 0 1 .5 3H8a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5"/>
        </svg>
        Select an artist to see their upcoming concerts.
      </div>
    </div>
    </div>
  );
}

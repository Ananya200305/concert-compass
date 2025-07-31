import React from 'react'

function TopArtist({topArtists,pinArtist,removeTopArtist}) {
  return (
    <div className="mb-6">
        <h2 className="text-sm font-semibold mb-2">Top Artists</h2>
        <div className="bg-[#1a1a1a] rounded-xl p-3 space-y-2 shadow-inner">
          {topArtists.length > 0 ? (
            topArtists.map((artist, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <img
                  src={artist.image || 'https://via.placeholder.com/32'}
                  alt={artist.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span>{artist.name}</span>
                <button onClick={() => pinArtist(artist)}>📌</button>
                <button
                  className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-900 text-white rounded-full"
                  onClick={() => removeTopArtist(artist)}
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">No top artists.</p>
          )}
        </div>
      </div>
  )
}

export default TopArtist

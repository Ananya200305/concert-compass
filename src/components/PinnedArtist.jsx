import React from 'react'

function PinnedArtist({pinnedArtist, unpinArtist}) {
  return (
    <div className="mb-6">
        <h2 className="text-sm font-semibold mb-2">Pinned Artists</h2>
        <div className="bg-[#1a1a1a] rounded-xl p-3 space-y-2 shadow-inner">
          {pinnedArtist.length > 0 ? (
            pinnedArtist.map((artist, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <img
                    src={artist.image || 'https://via.placeholder.com/32'}
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
            <p className="text-xs text-gray-400">No pinned artists.</p>
          )}
        </div>
      </div>
  )
}

export default PinnedArtist

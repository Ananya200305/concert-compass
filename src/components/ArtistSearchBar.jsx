import React, { useState, useEffect } from 'react'
import { getArtist } from '../utils/getArtist'

function ArtistSearchBar({ token, pinnedArtist, setPinnedArtist }) {
  const [artistInput, setArtistInput] = useState('')
  const [searchError, setSearchError] = useState(null)

  useEffect(() => {
    chrome.storage.local.get(['pinnedArtists'], (result) => {
      if (result.pinnedArtists) {
        setPinnedArtist(result.pinnedArtists)
      }
    })
  }, [])

  const searchAndPin = async () => {
    if (!artistInput.trim()) return
    setSearchError(null)

    try {
      const artist = await getArtist(artistInput, token)

      if (pinnedArtist.some((a) => a.name === artist.name)) {
        return setSearchError('Artist already pinned.')
      }

      const updatedPins = [...pinnedArtist, artist]
      setPinnedArtist(updatedPins)
      chrome.storage.local.set({ pinnedArtists: updatedPins })

      // Save to searched artist history
      chrome.storage.local.get(['searchedArtists'], (result) => {
        const currentHistory = result.searchedArtists || []
        const updatedHistory = [...currentHistory, artist].filter(
          (a, i, self) => i === self.findIndex((x) => x.name === a.name)
        )
        chrome.storage.local.set({ searchedArtists: updatedHistory })
      })

      setArtistInput('')
    } catch (error) {
      console.error('Error searching artists : ', error)
      setSearchError(error.message)
    }
  }

  return (
    <div>
      <div className="flex mb-6 bg-white/10 rounded-full p-2">
        <input
          type="text"
          value={artistInput}
          onChange={(e) => setArtistInput(e.target.value)}
          placeholder="Add an artist..."
          className="flex-1 pl-4 pr-2 py-2 rounded-full bg-[#1c1c1c] text-sm text-white focus:outline-none"
        />
        <button
          disabled={!artistInput.trim()}
          onClick={searchAndPin}
          className={`ml-2 px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 ${
            !artistInput.trim() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Add
        </button>
      </div>
      {searchError && <p className="text-xs text-red-400 mt-1 text-center">{searchError}</p>}
    </div>
  )
}

export default ArtistSearchBar

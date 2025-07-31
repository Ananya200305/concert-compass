export const getArtist = async (query, token) => {
    if(!token || !query.trim()){
        throw new Error("Missing token or artist name")
    }

    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=5`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await res.json();

    if(!data.artists?.items?.length) {
        throw new Error("Artist Not Found")
    }

    const match = data.artists.items.find(
        (item) => item.name.toLowerCase() === query.toLowerCase()
    )

    if(!match) {
        throw new Error("Artist Not Found")
    }

    return {
        name : match.name,
        image: match.images[0]?.url || null
    }
}
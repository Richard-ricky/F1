// src/app/hooks/useYouTube.ts — no API key needed for embed search
export function useYouTube() {
  const searchHighlights = async (raceName: string, year: number) => {
    // Use YouTube Data API v3 (needs VITE_YOUTUBE_API_KEY)
    const q = encodeURIComponent(`F1 ${year} ${raceName} highlights`)
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&maxResults=6&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`
    )
    return res.json()
  }

  return { searchHighlights }
}
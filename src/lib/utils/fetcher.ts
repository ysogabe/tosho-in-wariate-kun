/**
 * SWR用共通fetcher関数
 * 開発環境では認証バイパス、本番環境では認証Cookie付き
 */

// 開発環境かどうかの判定
const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// SWR用fetcher関数
export const fetcher = async (url: string) => {
  const fetchOptions: RequestInit = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }

  // 本番環境でのみ認証Cookie付き
  if (!isDev) {
    fetchOptions.credentials = 'include'
  }

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
}

// POST/PUT/DELETE用のfetch関数
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
) => {
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  // 本番環境でのみ認証Cookie付き
  if (!isDev) {
    fetchOptions.credentials = 'include'
  }

  return fetch(url, fetchOptions)
}

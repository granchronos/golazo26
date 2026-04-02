export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function generateInviteSlug(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let slug = ''
  for (let i = 0; i < 10; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)]
  }
  return slug
}

export function getRoomShareUrl(inviteSlug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/join/${inviteSlug}`
}

export function getWhatsAppShareUrl(inviteSlug: string, roomName: string): string {
  const url = getRoomShareUrl(inviteSlug)
  const text = `Te invito a pronosticar el Mundial 2026 en mi sala "${roomName}"! Únete con este link: ${url}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function getFacebookShareUrl(inviteSlug: string): string {
  const url = getRoomShareUrl(inviteSlug)
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
}

export function getTwitterShareUrl(inviteSlug: string, roomName: string): string {
  const url = getRoomShareUrl(inviteSlug)
  const text = `Te invito a pronosticar el Mundial 2026 en mi sala "${roomName}"! Únete:`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

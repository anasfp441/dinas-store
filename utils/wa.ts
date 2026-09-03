export function generateWaLink(message: string, phoneNumber: string): string {
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${phoneNumber}?text=${encoded}`
}

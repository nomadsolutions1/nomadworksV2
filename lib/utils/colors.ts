// Consistent color palette for site assignments
const SITE_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
]

export function getSiteColor(index: number): string {
  return SITE_COLORS[index % SITE_COLORS.length]
}

// Returns a lighter version for backgrounds (20% opacity)
export function getSiteColorBg(index: number): string {
  const hex = getSiteColor(index)
  return `${hex}33` // 20% opacity
}

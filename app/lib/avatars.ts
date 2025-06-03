// Monster URLs for consistent assignment
const MONSTERS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=monster1', // Robot monster
  'https://api.dicebear.com/7.x/bottts/svg?seed=monster2', // Alien monster
  'https://api.dicebear.com/7.x/bottts/svg?seed=monster3', // Ghost monster
  'https://api.dicebear.com/7.x/bottts/svg?seed=monster4', // Dragon monster
  'https://api.dicebear.com/7.x/bottts/svg?seed=monster5', // Dinosaur monster
  'https://api.dicebear.com/7.x/bottts/svg?seed=monster6', // Octopus monster
  'https://api.dicebear.com/7.x/bottts/svg?seed=monster7', // Spider monster
  'https://api.dicebear.com/7.x/bottts/svg?seed=monster8', // Slime monster
]

// Function to get a consistent monster for a user ID or name
function getUserMonster(idOrName: string): string {
  // Convert to lowercase and take last three letters
  const input = idOrName.toLowerCase().slice(-3)
  
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Use the hash to select a monster
  return MONSTERS[Math.abs(hash) % MONSTERS.length];
}

// Main function to get user avatar - always returns a monster
export function getUserAvatar(userId: string, _imageUrl?: string | null): string {
  // Always return the monster avatar, ignoring custom avatars
  return getUserMonster(userId);
}

// Function to get initials for fallback display
export function getUserInitials(name: string): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
} 
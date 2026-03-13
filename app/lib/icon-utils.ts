// Heroicon名称到emoji的映射
export const heroiconToEmoji: Record<string, string> = {
  'cpu-chip': '💾',
  'cube': '📦',
  'device-phone-mobile': '📱',
  'computer-desktop': '🖥️',
  'laptop': '💻',
  'watch': '⌚',
  'camera': '📷',
  'speakerphone': '🔊',
  'keyboard': '⌨️',
  'mouse': '🖱️',
  'tv': '📺',
  'printer': '🖨️',
  'truck': '🚚',
  'car': '🚗',
  'taxi': '🚕',
  'bus': '🚌',
  'train': '🚂',
  'paper-airplane': '✈️',
  'rocket-launch': '🚀',
  'globe-alt': '🌍',
  'ship': '🚢',
  'chair': '🪑',
  'sofa': '🛋️',
  'bed': '🛏️',
  'door-open': '🚪',
  'window': '🪟',
  'bolt': '⚡',
  'light-bulb': '💡',
  'refrigerator': '🧊',
  'washing-machine': '🧺',
  'wrench': '🔧',
  'hammer': '🔨',
  'screwdriver': '🪛',
  'cog': '⚙️',
  'scissors': '✂️',
  'paint-brush': '🖌️',
  'shield': '🛡️',
  'sword': '⚔️',
  'burger': '🍔',
  'pizza': '🍕',
  'apple': '🍎',
  'cup-and-saucer': '☕',
  'cake': '🎂',
  'tshirt': '👕',
  'shopping-bag': '🛍️',
  'shoe': '👟',
  'glasses': '👓',
  'book-open': '📖',
  'document-text': '📄',
  'pencil': '✏️',
  'ruler': '📏',
  'paper-clip': '📎',
  'trophy': '🏆',
  'basketball': '🏀',
  'tennis-ball': '🎾',
  'musical-note': '🎵',
  'piano': '🎹',
};

// 判断是否是emoji
export const isEmoji = (str: string): boolean => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(str);
};

// 获取显示图标
export const getDisplayIcon = (icon: string | null | undefined, fallback: string = '📦'): string => {
  if (!icon) return fallback;
  if (isEmoji(icon)) return icon;
  return heroiconToEmoji[icon] || fallback;
};

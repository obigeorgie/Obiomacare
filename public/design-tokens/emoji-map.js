/**
 * Emoji to Lucide Icon Mapping
 * Used by scripts/replace-emojis.js
 * 
 * RULE: Every emoji in the UI must map to a Lucide icon.
 * Content emojis (patient scenarios) may be replaced with text or kept if educational.
 * 
 * @license MIT — Obioma Care
 */

const emojiToIcon = {
  // ─── UI / Check & Cross ───
  '✅':  { icon: 'check-circle',   class: 'icon icon-coral', aria: 'Completed' },
  '✓':   { icon: 'check',          class: 'icon icon-coral', aria: 'Yes' },
  '❌':  { icon: 'x-circle',       class: 'icon icon-error', aria: 'Incorrect' },
  '✗':   { icon: 'x',              class: 'icon icon-error', aria: 'No' },
  '☐':   { icon: 'square',         class: 'icon icon-secondary', aria: 'Unchecked' },
  '△':   { icon: 'triangle',       class: 'icon icon-secondary', aria: 'Note' },

  // ─── Medical / Health ───
  '🩺':  { icon: 'stethoscope',    class: 'icon icon-coral', aria: 'Medical' },
  '🏥':  { icon: 'building-2',     class: 'icon icon-coral', aria: 'Hospital' },
  '⚕️':  { icon: 'heart-pulse',    class: 'icon icon-coral', aria: 'Healthcare' },
  '💉':  { icon: 'syringe',        class: 'icon icon-coral', aria: 'Injection' },
  '💊':  { icon: 'pill',           class: 'icon icon-coral', aria: 'Medication' },
  '🩹':  { icon: 'bandage',        class: 'icon icon-coral', aria: 'Wound care' },
  '🩸':  { icon: 'droplets',       class: 'icon icon-error', aria: 'Bleeding' },
  '🫀':  { icon: 'heart',          class: 'icon icon-coral', aria: 'Cardiac' },
  '🫁':  { icon: 'wind',           class: 'icon icon-coral', aria: 'Respiratory' },
  '🧠':  { icon: 'brain',          class: 'icon icon-coral', aria: 'Neurology' },
  '🦴':  { icon: 'bone',           class: 'icon icon-coral', aria: 'Orthopedic' },
  '🌡️':  { icon: 'thermometer',    class: 'icon icon-warning', aria: 'Temperature' },
  '♿':  { icon: 'accessibility',  class: 'icon icon-coral', aria: 'Accessibility' },

  // ─── Study / Education ───
  '📚':  { icon: 'book-open',      class: 'icon icon-coral', aria: 'Study guides' },
  '📖':  { icon: 'book-open',      class: 'icon icon-coral', aria: 'Reading' },
  '📝':  { icon: 'file-text',      class: 'icon icon-coral', aria: 'Notes' },
  '📋':  { icon: 'clipboard-list', class: 'icon icon-coral', aria: 'Checklist' },
  '📊':  { icon: 'bar-chart-3',    class: 'icon icon-coral', aria: 'Analytics' },
  '📈':  { icon: 'trending-up',    class: 'icon icon-success', aria: 'Improving' },
  '📉':  { icon: 'trending-down',  class: 'icon icon-error', aria: 'Declining' },
  '💻':  { icon: 'monitor',        class: 'icon icon-coral', aria: 'Computer' },
  '📱':  { icon: 'smartphone',     class: 'icon icon-coral', aria: 'Mobile' },
  '🔍':  { icon: 'search',         class: 'icon icon-coral', aria: 'Search' },
  '🔬':  { icon: 'microscope',     class: 'icon icon-coral', aria: 'Lab' },
  '🧪':  { icon: 'flask-conical',  class: 'icon icon-coral', aria: 'Laboratory' },
  '🧬':  { icon: 'dna',            class: 'icon icon-coral', aria: 'Genetics' },
  '🧮':  { icon: 'calculator',     class: 'icon icon-coral', aria: 'Calculate' },
  '🎓':  { icon: 'graduation-cap', class: 'icon icon-coral', aria: 'Education' },
  '🏆':  { icon: 'trophy',         class: 'icon icon-coral', aria: 'Achievement' },
  '🥇':  { icon: 'medal',          class: 'icon icon-coral', aria: 'First place' },
  '🎯':  { icon: 'target',         class: 'icon icon-coral', aria: 'Goal' },
  '🧩':  { icon: 'puzzle',         class: 'icon icon-coral', aria: 'Puzzle' },
  '💡':  { icon: 'lightbulb',      class: 'icon icon-warning', aria: 'Idea' },

  // ─── Communication ───
  '💬':  { icon: 'message-circle', class: 'icon icon-coral', aria: 'Chat' },
  '📧':  { icon: 'mail',           class: 'icon icon-coral', aria: 'Email' },
  '📤':  { icon: 'send',           class: 'icon icon-coral', aria: 'Send' },
  '📥':  { icon: 'download',       class: 'icon icon-coral', aria: 'Download' },
  '📑':  { icon: 'files',          class: 'icon icon-coral', aria: 'Documents' },
  '📜':  { icon: 'scroll-text',    class: 'icon icon-coral', aria: 'Script' },

  // ─── Actions / Navigation ───
  '🔥':  { icon: 'flame',          class: 'icon icon-coral', aria: 'Hot' },
  '⚡':  { icon: 'zap',            class: 'icon icon-warning', aria: 'Fast' },
  '🚀':  { icon: 'rocket',         class: 'icon icon-coral', aria: 'Launch' },
  '🔄':  { icon: 'refresh-cw',     class: 'icon icon-coral', aria: 'Refresh' },
  '⛓️':  { icon: 'link',           class: 'icon icon-coral', aria: 'Link' },
  '🔧':  { icon: 'wrench',         class: 'icon icon-coral', aria: 'Settings' },
  '🛠️':  { icon: 'tools',          class: 'icon icon-coral', aria: 'Tools' },
  '🔒':  { icon: 'lock',           class: 'icon icon-success', aria: 'Secure' },
  '🛡️':  { icon: 'shield-check',   class: 'icon icon-success', aria: 'Protected' },
  '👍':  { icon: 'thumbs-up',      class: 'icon icon-coral', aria: 'Like' },
  '👆':  { icon: 'arrow-up',       class: 'icon icon-coral', aria: 'Up' },
  '👇':  { icon: 'arrow-down',     class: 'icon icon-coral', aria: 'Down' },
  '✋':  { icon: 'hand',           class: 'icon icon-warning', aria: 'Stop' },
  '✍️':  { icon: 'pen-tool',       class: 'icon icon-coral', aria: 'Write' },

  // ─── Status / Alerts ───
  '⚠️':  { icon: 'alert-triangle', class: 'icon icon-warning', aria: 'Warning' },
  '⚠':   { icon: 'alert-triangle', class: 'icon icon-warning', aria: 'Warning' },
  '🚨':  { icon: 'alert-octagon',  class: 'icon icon-error', aria: 'Emergency' },
  '🚧':  { icon: 'construction',   class: 'icon icon-warning', aria: 'Under construction' },
  '🚫':  { icon: 'ban',            class: 'icon icon-error', aria: 'Prohibited' },
  '🔴':  { icon: 'circle',         class: 'icon icon-error', aria: 'Red' },
  '🔵':  { icon: 'circle',         class: 'icon icon-info', aria: 'Blue' },
  '⚪':  { icon: 'circle',         class: 'icon icon-secondary', aria: 'White' },
  '⚫':  { icon: 'circle',         class: 'icon icon-primary', aria: 'Black' },
  '☢️':  { icon: 'radiation',      class: 'icon icon-warning', aria: 'Radiation' },

  // ─── Emotions / Patient Scenarios ───
  // These appear in educational content (patient reactions, feelings)
  // Replace with text descriptions or keep if contextually meaningful
  '😔':  { icon: null, text: '(sad)', aria: 'Sad' },
  '😣':  { icon: null, text: '(in pain)', aria: 'In pain' },
  '😰':  { icon: null, text: '(anxious)', aria: 'Anxious' },
  '😴':  { icon: null, text: '(sleepy)', aria: 'Sleepy' },
  '💪':  { icon: 'activity',       class: 'icon icon-coral', aria: 'Strong' },
  '❤️':  { icon: 'heart',          class: 'icon icon-error', aria: 'Love' },
  '💓':  { icon: 'heart',          class: 'icon icon-error', aria: 'Heartbeat' },
  '💜':  { icon: 'heart',          class: 'icon icon-coral', aria: 'Heart' },
  '🕊️':  { icon: 'bird',           class: 'icon icon-coral', aria: 'Peace' },
  '🦋':  { icon: null, text: '(butterfly)', aria: 'Butterfly' },
  '🧘':  { icon: null, text: '(calm)', aria: 'Calm' },

  // ─── Objects / Items ───
  '🍎':  { icon: 'apple',          class: 'icon icon-coral', aria: 'Apple' },
  '🍼':  { icon: null, text: '(bottle)', aria: 'Bottle' },
  '🍳':  { icon: null, text: '(cooking)', aria: 'Cooking' },
  '🍬':  { icon: null, text: '(candy)', aria: 'Candy' },
  '🍭':  { icon: null, text: '(lollipop)', aria: 'Lollipop' },
  '🍂':  { icon: null, text: '(fall)', aria: 'Autumn' },
  '💧':  { icon: 'droplet',        class: 'icon icon-info', aria: 'Water' },
  '🌍':  { icon: 'globe',          class: 'icon icon-coral', aria: 'Global' },
  '🗺️':  { icon: 'map',            class: 'icon icon-coral', aria: 'Map' },
  '🌅':  { icon: 'sunrise',        class: 'icon icon-coral', aria: 'Morning' },
  '🌬️':  { icon: 'wind',           class: 'icon icon-coral', aria: 'Wind' },

  // ─── People ───
  '👩':  { icon: 'user',           class: 'icon icon-coral', aria: 'Woman' },
  '👶':  { icon: 'baby',           class: 'icon icon-coral', aria: 'Baby' },
  '🤱':  { icon: null, text: '(breastfeeding)', aria: 'Breastfeeding' },
  '🏃':  { icon: 'person-standing', class: 'icon icon-coral', aria: 'Person' },
  '🦾':  { icon: null, text: '(prosthetic)', aria: 'Prosthetic' },

  // ─── Misc ───
  '🆕':  { icon: 'badge-plus',     class: 'icon icon-success', aria: 'New' },
  '🎉':  { icon: 'party-popper',   class: 'icon icon-coral', aria: 'Celebrate' },
  '⭐':  { icon: 'star',           class: 'icon icon-warning', aria: 'Star' },
  '🎢':  { icon: 'roller-coaster', class: 'icon icon-coral', aria: 'Roller coaster' },
  '💰':  { icon: 'coins',          class: 'icon icon-success', aria: 'Money' },
  '🦠':  { icon: 'bug',            class: 'icon icon-error', aria: 'Virus' },
  '⚖️':  { icon: 'scale',          class: 'icon icon-coral', aria: 'Balance' },
  '🫘':  { icon: 'bean',           class: 'icon icon-coral', aria: 'Bean' },
};

// Variants that should be treated the same
const variants = {
  '😭😭': '😔',  // treat as sad
};

module.exports = { emojiToIcon, variants };

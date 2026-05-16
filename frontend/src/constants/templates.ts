export type Category =
  | "wedding"
  | "birthday"
  | "baby_shower"
  | "party"
  | "corporate"
  | "casual_meetup";

export const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: "wedding", label: "Wedding", emoji: "\u{1F48D}" },
  { id: "birthday", label: "Birthday", emoji: "\u{1F382}" },
  { id: "baby_shower", label: "Baby Shower", emoji: "\u{1F37C}" },
  { id: "party", label: "Party", emoji: "\u{1F389}" },
  { id: "corporate", label: "Corporate", emoji: "\u{1F4BC}" },
  { id: "casual_meetup", label: "Casual", emoji: "\u{2615}" },
];

export const CATEGORY_COLORS: Record<Category, string> = {
  wedding: "#E5D9C5",
  birthday: "#FDE68A",
  baby_shower: "#A7F3D0",
  party: "#FBCFE8",
  corporate: "#BFDBFE",
  casual_meetup: "#FED7AA",
};

export const TEMPLATE_IMAGES: Record<Category, string[]> = {
  wedding: [
    "https://images.unsplash.com/photo-1551468307-8c1e3c78013c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd2VkZGluZyUyMG1pbmltYWwlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODk1MTYwNnww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1551468188-4b8ed67c5bfa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwyfHxlbGVnYW50JTIwd2VkZGluZyUyMG1pbmltYWwlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODk1MTYwNnww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1551546897-0cf94d9bb428?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwzfHxlbGVnYW50JTIwd2VkZGluZyUyMG1pbmltYWwlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODk1MTYwNnww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1551468220-0a25172193f9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHw0fHxlbGVnYW50JTIwd2VkZGluZyUyMG1pbmltYWwlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3ODk1MTYwNnww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80",
    "https://images.unsplash.com/photo-1522413452208-996ff3f3e740?w=900&q=80",
    "https://images.unsplash.com/photo-1525772764200-be829a350797?w=900&q=80",
    "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=900&q=80",
  ],
  birthday: [
    "https://images.unsplash.com/photo-1767070805937-de496d694419?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHw0fHxiaXJ0aGRheSUyMHBhcnR5JTIwYmFsbG9vbnMlMjBhZXN0aGV0aWN8ZW58MHx8fHwxNzc4OTUxNjA3fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1604668915840-580c30026e5f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwxfHxiaXJ0aGRheSUyMHBhcnR5JTIwYmFsbG9vbnMlMjBhZXN0aGV0aWN8ZW58MHx8fHwxNzc4OTUxNjA3fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1595678816463-f94d2070f0a3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwyfHxiaXJ0aGRheSUyMHBhcnR5JTIwYmFsbG9vbnMlMjBhZXN0aGV0aWN8ZW58MHx8fHwxNzc4OTUxNjA3fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1595678816444-12382c333081?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwzfHxiaXJ0aGRheSUyMHBhcnR5JTIwYmFsbG9vbnMlMjBhZXN0aGV0aWN8ZW58MHx8fHwxNzc4OTUxNjA3fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=80",
    "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=900&q=80",
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=900&q=80",
    "https://images.unsplash.com/photo-1496024840928-4c417adf211d?w=900&q=80",
  ],
  baby_shower: [
    "https://images.unsplash.com/photo-1579546928686-286c9fbde1ec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwxfHxiYWJ5JTIwc2hvd2VyJTIwY3V0ZSUyMHBhc3RlbCUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc4OTUxNjA3fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1614853035846-77b0a40a6b5c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwyfHxiYWJ5JTIwc2hvd2VyJTIwY3V0ZSUyMHBhc3RlbCUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc4OTUxNjA3fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1770780604844-5ec3d63ed15a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwzfHxiYWJ5JTIwc2hvd2VyJTIwY3V0ZSUyMHBhc3RlbCUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc4OTUxNjA3fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1628699265231-97b2a3e7b9ae?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHw0fHxiYWJ5JTIwc2hvd2VyJTIwY3V0ZSUyMHBhc3RlbCUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc4OTUxNjA3fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=900&q=80",
    "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=900&q=80",
    "https://images.unsplash.com/photo-1564429097439-e7fb44d63ed4?w=900&q=80",
    "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=900&q=80",
  ],
  party: [
    "https://images.unsplash.com/photo-1545128485-c400e7702796?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwxfHxuaWdodCUyMGNsdWIlMjBwYXJ0eSUyMGFlc3RoZXRpYyUyMGxpZ2h0c3xlbnwwfHx8fDE3Nzg5NTE2MDd8MA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1687511844598-165c1fc387cc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwyfHxuaWdodCUyMGNsdWIlMjBwYXJ0eSUyMGFlc3RoZXRpYyUyMGxpZ2h0c3xlbnwwfHx8fDE3Nzg5NTE2MDd8MA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1574154894072-18ba0d48321b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwzfHxuaWdodCUyMGNsdWIlMjBwYXJ0eSUyMGFlc3RoZXRpYyUyMGxpZ2h0c3xlbnwwfHx8fDE3Nzg5NTE2MDd8MA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1713450605268-5f8ba67f5b55?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHw0fHxuaWdodCUyMGNsdWIlMjBwYXJ0eSUyMGFlc3RoZXRpYyUyMGxpZ2h0c3xlbnwwfHx8fDE3Nzg5NTE2MDd8MA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=900&q=80",
    "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=900&q=80",
    "https://images.unsplash.com/photo-1571266028243-d220c6a3b9e3?w=900&q=80",
  ],
  corporate: [
    "https://images.unsplash.com/photo-1510511233900-1982d92bd835?crop=entropy&cs=srgb&fm=jpg&ixid=M3w8NTYxOTB8MHwxfHNlYXJjaHwzfHxjb3Jwb3JhdGUlMjBldmVudCUyMHByb2Zlc3Npb25hbCUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc4OTUxNjA3fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1531058020387-3be344556be6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w8NTYxOTB8MHwxfHNlYXJjaHwxfHxjb3Jwb3JhdGUlMjBldmVudCUyMHByb2Zlc3Npb25hbCUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc4OTUxNjA3fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1700514077430-3659e38eb5e7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w8NTYxOTB8MHwxfHNlYXJjaHw0fHxjb3Jwb3JhdGUlMjBldmVudCUyMHByb2Zlc3Npb25hbCUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc4OTUxNjA3fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1653821355736-0c2598d0a63e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w8NTYxOTB8MHwxfHNlYXJjaHwyfHxjb3Jwb3JhdGUlMjBldmVudCUyMHByb2Zlc3Npb25hbCUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc4OTUxNjA3fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=900&q=80",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80",
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=900&q=80",
    "https://images.unsplash.com/photo-1524749292158-7540c2494485?w=900&q=80",
  ],
  casual_meetup: [
    "https://images.unsplash.com/photo-1722077905962-da47b8f44d9d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwzfHxjYXN1YWwlMjBtZWV0dXAlMjBjb2ZmZWUlMjBmcmllbmRzJTIwYWVzdGhldGljfGVufDB8fHx8MTc3ODk1MTYwN3ww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1759960034444-99fc2da398bc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHxjYXN1YWwlMjBtZWV0dXAlMjBjb2ZmZWUlMjBmcmllbmRzJTIwYWVzdGhldGljfGVufDB8fHx8MTc3ODk1MTYwN3ww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1778594189841-f50f23773d54?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBtZWV0dXAlMjBjb2ZmZWUlMjBmcmllbmRzJTIwYWVzdGhldGljfGVufDB8fHx8MTc3ODk1MTYwN3ww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=900&q=80",
    "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=900&q=80",
    "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=900&q=80",
    "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?w=900&q=80",
  ],
};

export const TEXT_COLORS = [
  "#FFFFFF",
  "#1A1A1A",
  "#E26D5A",
  "#7C3AED",
  "#0EA5E9",
  "#F59E0B",
  "#10B981",
  "#EC4899",
];

export const PRESET_TITLES: Record<Category, string> = {
  wedding: "Two hearts, one journey",
  birthday: "Let's celebrate!",
  baby_shower: "A little one is on the way",
  party: "You're invited",
  corporate: "Save the date",
  casual_meetup: "Come hang out",
};

export const PRESET_MESSAGES: Record<Category, string> = {
  wedding:
    "Join us as we say 'I do' and begin our forever. Your presence is the greatest gift.",
  birthday:
    "Cake, candles, and good vibes only. Come help blow out the candles!",
  baby_shower:
    "Help us shower the parents-to-be with love, gifts, and sweet wishes.",
  party: "Good music, great people, unforgettable night. Don't miss out!",
  corporate:
    "You are cordially invited to join us for an evening of networking and insights.",
  casual_meetup: "Coffee, conversation, and catching up. Let's make it happen!",
};

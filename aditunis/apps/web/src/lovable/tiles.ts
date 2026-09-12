export type CategoryKey = "needs" | "feelings" | "medical" | "social" | "emergency" | "routine";

export interface PhraseTile {
  id: string;
  label: string;
  emoji: string;
  category: CategoryKey;
}

// Adapted from Lovable project 42e916c5-9234-4c93-be4a-28f4364094c1.
// These are participant-selected AAC phrases. Emergency-category tiles are
// communication only and never trigger a call or automated emergency action.
export const DEFAULT_TILES: PhraseTile[] = [
  { id: "n1", label: "I need water", emoji: "💧", category: "needs" },
  { id: "n2", label: "I am hungry", emoji: "🍽️", category: "needs" },
  { id: "n3", label: "I need the bathroom", emoji: "🚻", category: "needs" },
  { id: "n4", label: "I am tired", emoji: "😴", category: "needs" },
  { id: "n5", label: "I want to go outside", emoji: "🌤️", category: "needs" },
  { id: "n6", label: "I need help", emoji: "🤲", category: "needs" },
  { id: "fe1", label: "I am happy", emoji: "😊", category: "feelings" },
  { id: "fe2", label: "I am sad", emoji: "😢", category: "feelings" },
  { id: "fe3", label: "I am frustrated", emoji: "😤", category: "feelings" },
  { id: "fe4", label: "I feel calm", emoji: "🌿", category: "feelings" },
  { id: "fe5", label: "I am anxious", emoji: "😰", category: "feelings" },
  { id: "fe6", label: "I love you", emoji: "❤️", category: "feelings" },
  { id: "m1", label: "I am in pain", emoji: "🩹", category: "medical" },
  { id: "m2", label: "I need my medicine", emoji: "💊", category: "medical" },
  { id: "m3", label: "I feel dizzy", emoji: "💫", category: "medical" },
  { id: "m4", label: "I feel nauseous", emoji: "🤢", category: "medical" },
  { id: "m5", label: "Please call my doctor", emoji: "👩‍⚕️", category: "medical" },
  { id: "s1", label: "Hello", emoji: "👋", category: "social" },
  { id: "s2", label: "Thank you", emoji: "🙏", category: "social" },
  { id: "s3", label: "Yes", emoji: "✅", category: "social" },
  { id: "s4", label: "No", emoji: "🚫", category: "social" },
  { id: "s5", label: "Please wait", emoji: "⏳", category: "social" },
  { id: "s6", label: "Goodbye", emoji: "🫶", category: "social" },
  { id: "e1", label: "Call for help now", emoji: "🚨", category: "emergency" },
  { id: "e2", label: "Please call my support person", emoji: "📞", category: "emergency" },
  { id: "e3", label: "I cannot breathe well", emoji: "🫁", category: "emergency" },
  { id: "r1", label: "Time to eat", emoji: "🍴", category: "routine" },
  { id: "r2", label: "Time to rest", emoji: "🛏️", category: "routine" },
  { id: "r3", label: "Let's go for a walk", emoji: "🚶", category: "routine" },
  { id: "r4", label: "Time to take medicine", emoji: "⏰", category: "routine" }
];

export const CATEGORY_META: Record<CategoryKey, { label: string; description: string }> = {
  needs: { label: "Needs", description: "Daily wants and needs" },
  feelings: { label: "Feelings", description: "How you feel" },
  medical: { label: "Medical", description: "Health and symptoms" },
  social: { label: "Social", description: "Greetings and replies" },
  emergency: { label: "Emergency", description: "Urgent communication phrases" },
  routine: { label: "Daily routine", description: "Activities and schedule" }
};

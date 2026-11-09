import { BadgeCheck, ShieldCheck, Smartphone, Upload, Video } from "lucide-react";
import type { CreatorResult } from "@/components/ui/CreatorResults";
import type { FaqItem } from "@/components/ui/ObjectionFaq";
import { StkPushDemo } from "@/components/ui/StkPushDemo";

// SAMPLE DATA: replace with real creators (with written consent) before claiming results.
export const sampleResults: CreatorResult[] = [
  {
    id: "r1",
    name: "Wanjiru Kamau",
    role: "Founder, Kilimani Property Masterclass",
    niche: "real-estate",
    isVerifiedSender: true,
    isSample: true,
    before: 18,
    after: 54,
    registrants: 212,
    revenueKes: 640000,
    webinarWhen: "Sat 10:00 EAT",
    quote:
      "Email reminders sat in Promotions. The 9:00 EAT WhatsApp nudge filled the room before I even went live.",
  },
  {
    id: "r2",
    name: "Brian Otieno",
    role: "Host, Nairobi Forex Floor",
    niche: "crypto-forex",
    isVerifiedSender: true,
    isSample: true,
    before: 21,
    after: 57,
    registrants: 340,
    revenueKes: 285000,
    webinarWhen: "Wed 19:30 EAT",
    quote:
      "Evening webinars after work are tough. The 30-minute reminder brought people back from the matatu.",
  },
  {
    id: "r3",
    name: "Achieng Odhiambo",
    role: "Owner, Thika Road Thrift & Kicks",
    niche: "ecommerce",
    isVerifiedSender: true,
    isSample: true,
    before: 16,
    after: 49,
    registrants: 158,
    revenueKes: 172000,
    webinarWhen: "Sun 15:00 EAT",
    quote: "Our Facebook leads don't check email. They answer WhatsApp in minutes.",
  },
  {
    id: "r4",
    name: "Kevin Mwangi",
    role: "Business Coach, Westlands",
    niche: "consulting",
    isVerifiedSender: true,
    isSample: true,
    before: 24,
    after: 60,
    registrants: 96,
    revenueKes: 900000,
    webinarWhen: "Thu 18:00 EAT",
    quote:
      "For high-ticket calls, twenty more people in the room is the difference between a quiet month and a full one.",
  },
];

export const faqItems: FaqItem[] = [
  {
    id: "safety",
    category: "safety",
    question: "Will my WhatsApp number get banned?",
    icon: ShieldCheck,
    answer:
      "Reminders go through the official Meta WhatsApp Cloud API, only to people who registered for your webinar. You never send from your personal number.",
    bullets: [
      "Official Meta Cloud API, not a scraped web session",
      "Only registrants receive messages",
      "Pre-approved message templates",
    ],
  },
  {
    id: "mpesa",
    category: "payments",
    question: "How does M-Pesa STK push work?",
    icon: Smartphone,
    answer:
      "Tap Launch, get a prompt on your phone, enter your M-Pesa PIN and pay KES 1,500. No card, no subscription.",
    demo: <StkPushDemo />,
  },
  {
    id: "leads",
    category: "leads",
    question: "Can I upload a CSV or connect Facebook Lead Ads?",
    icon: Upload,
    answer:
      "Both. Upload a CSV, or connect Meta Lead Ads so new leads flow in automatically. Phone numbers are normalised to +254 format.",
    bullets: ["CSV upload", "Meta Lead Ads", "Hosted registration page"],
  },
  {
    id: "streaming",
    category: "streaming",
    question: "Does it work with Zoom and YouTube Live?",
    icon: Video,
    answer:
      "Yes. Paste your join link and every reminder carries it, so attendees tap straight into your room.",
    bullets: ["Zoom", "YouTube Live", "Google Meet or any link"],
  },
];

export { BadgeCheck };


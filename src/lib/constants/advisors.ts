export interface Advisor {
  id: string;
  name: string;
  title: string;
  tagline: string;
  expertise: string[];
  bio: string;
  color: string;
  shape: "circle" | "hexagon" | "diamond" | "square" | "triangle" | "pentagon" | "octagon" | "star";
}

export const advisors: Advisor[] = [
  {
    id: "okafor",
    name: "Dr. Amara Okafor",
    title: "Chief Conflict Analyst",
    tagline: "I see the patterns others miss.",
    expertise: ["Conflict escalation modeling", "Early warning systems", "Political economy of war", "Sub-Saharan Africa"],
    bio: "15 years at the International Crisis Group. Developed risk frameworks deployed across 40+ conflict zones. Specializes in sub-Saharan Africa and the Sahel.",
    color: "#E8B931",
    shape: "hexagon",
  },
  {
    id: "tanaka",
    name: "Ambassador Kenji Tanaka",
    title: "Diplomatic Strategy Advisor",
    tagline: "Every negotiation has a grammar. I teach you to read it.",
    expertise: ["Multilateral negotiations", "UNSC dynamics", "Consensus-building", "Asia-Pacific"],
    bio: "Former Japanese diplomat with postings at UN New York and Geneva. Led back-channel facilitation for three Asian territorial disputes.",
    color: "#4A90A4",
    shape: "diamond",
  },
  {
    id: "mitchell",
    name: "Col. (Ret.) Sarah Mitchell",
    title: "Security & Defense Analyst",
    tagline: "Security isn\u2019t just about weapons. It\u2019s about understanding intent.",
    expertise: ["Military affairs", "Peacekeeping operations", "DDR processes", "Security sector reform"],
    bio: "20 years in NATO and OSCE missions. Directed security assessments for UNMISS and MINUSMA.",
    color: "#3D5A80",
    shape: "square",
  },
  {
    id: "hassan",
    name: "Dr. Layla Hassan",
    title: "International Law Specialist",
    tagline: "The law is the last language of peace.",
    expertise: ["International humanitarian law", "ICC jurisprudence", "Sanctions law", "Treaty interpretation"],
    bio: "Former Legal Counsel at the ICC. Published extensively on accountability mechanisms and transitional justice.",
    color: "#A63D40",
    shape: "circle",
  },
  {
    id: "ferreira",
    name: "Marco Ferreira",
    title: "Media & Narratives Strategist",
    tagline: "Control the narrative, shape the outcome.",
    expertise: ["Strategic communications", "Disinformation analysis", "Media landscape mapping", "Public diplomacy"],
    bio: "Former BBC World Service editor and UNDPPA communications lead. Expert in information warfare in conflict zones.",
    color: "#C75B39",
    shape: "pentagon",
  },
  {
    id: "sharma",
    name: "Dr. Priya Sharma",
    title: "Humanitarian Operations Advisor",
    tagline: "Behind every number is a person waiting for a decision.",
    expertise: ["Humanitarian response", "OCHA coordination", "IDP/refugee flows", "Needs assessments"],
    bio: "12 years with UNHCR and OCHA. Led emergency responses in Syria, Yemen, and the DRC. Specializes in civ-mil coordination.",
    color: "#5B8C5A",
    shape: "triangle",
  },
  {
    id: "eriksen",
    name: "Dr. Thomas Eriksen",
    title: "Political Economy Analyst",
    tagline: "Follow the money and you\u2019ll find the conflict.",
    expertise: ["Natural resource conflicts", "Illicit financial flows", "Sanctions evasion", "Economic drivers of war"],
    bio: "Former World Bank conflict advisor. Mapped financial networks sustaining armed groups in Central Africa and Myanmar.",
    color: "#7B6D8D",
    shape: "octagon",
  },
  {
    id: "al-rashid",
    name: "Ambassador Fatima Al-Rashid",
    title: "Mediation & Process Design Expert",
    tagline: "Peace is not signed. It is designed.",
    expertise: ["Mediation process design", "Track II diplomacy", "Women in peace processes", "Constitution-making"],
    bio: "Led AU mediation support for the Horn of Africa. Designed inclusive dialogue frameworks adopted by UN DPA.",
    color: "#D4A373",
    shape: "star",
  },
  {
    id: "nakamura",
    name: "Dr. Yuki Nakamura",
    title: "Gender & WPS Specialist",
    tagline: "Inclusive peace is lasting peace. Half the population cannot be an afterthought.",
    expertise: ["Women, Peace & Security (UNSCR 1325)", "Gender-responsive mediation", "GBV in conflict", "Inclusive political transitions"],
    bio: "Former UN Women Senior Advisor and co-author of the NAP 1325 framework adopted in 14 countries. Led gender analysis for peace talks in South Sudan and Colombia.",
    color: "#C084FC",
    shape: "hexagon",
  },
  {
    id: "mensah",
    name: "Prof. Kwame Mensah",
    title: "Transitional Justice Advisor",
    tagline: "Accountability and reconciliation are not opposites. Both are necessary.",
    expertise: ["Truth & reconciliation commissions", "Reparations frameworks", "Lustration processes", "Post-conflict constitution-making"],
    bio: "Former UN Special Rapporteur on Truth, Justice and Reparations. Advised TRCs in Rwanda, Sierra Leone, and Côte d'Ivoire. Professor of International Law at Accra.",
    color: "#34D399",
    shape: "diamond",
  },
];

export interface InterestOption {
  id: string;
  name: string;
  category: string;
  description: string;
}

export const CANONICAL_INTERESTS: InterestOption[] = [
  {
    id: "technology",
    name: "Technology & Software",
    category: "STEM",
    description: "Software engineering, web development, cloud computing, and AI tools.",
  },
  {
    id: "sports",
    name: "Sports & Athletics",
    category: "Athletics",
    description: "Football, basketball, rugby, track and field, and fitness training.",
  },
  {
    id: "arts",
    name: "Visual Arts & Design",
    category: "Creative",
    description: "Photography, graphic design, painting, animation, and digital illustration.",
  },
  {
    id: "music",
    name: "Music & Performing Arts",
    category: "Creative",
    description: "Instrumental music, vocal choir, sound production, drama, and theater.",
  },
  {
    id: "faith",
    name: "Faith & Spiritual Life",
    category: "Community",
    description: "Campus ministries, spiritual fellowship, scripture study, and chaplaincy.",
  },
  {
    id: "leadership",
    name: "Student Leadership & Governance",
    category: "Governance",
    description: "Student union representation, parliamentary debate, and advocacy.",
  },
  {
    id: "community_service",
    name: "Community Service & Outreach",
    category: "Civic",
    description: "Red Cross volunteering, environmental conservation, and social impact drives.",
  },
  {
    id: "entrepreneurship",
    name: "Entrepreneurship & Startups",
    category: "Business",
    description: "Venture ideation, fintech innovations, incubation, and business networking.",
  },
  {
    id: "health",
    name: "Health & Wellness",
    category: "Wellness",
    description: "Mental health awareness, first aid certification, and student wellbeing.",
  },
  {
    id: "environment",
    name: "Environment & Sustainability",
    category: "Civic",
    description: "Climate action, campus greening, waste recycling, and conservation.",
  },
];

export const CANONICAL_INTEREST_IDS = CANONICAL_INTERESTS.map((i) => i.id);

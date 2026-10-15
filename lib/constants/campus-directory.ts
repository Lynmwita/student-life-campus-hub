export interface CampusCommunity {
  id: string;
  slug: string;
  name: string;
  category:
    | "technology"
    | "sports"
    | "faith"
    | "arts"
    | "leadership"
    | "community_service"
    | "academic";
  categoryLabel: string;
  description: string;
  memberCount: string;
  meetingSchedule: string;
  venue: string;
  patronName?: string;
  canonicalInterestId: string;
  facultyMatches?: string[];
  tags: string[];
}

export const KENYAN_CAMPUS_DIRECTORY: CampusCommunity[] = [
  // 1. Tech & Innovation
  {
    id: "gdsc-chapter",
    slug: "gdsc-chapter",
    name: "Google Developer Student Club (GDSC)",
    category: "technology",
    categoryLabel: "Tech & Innovation",
    description:
      "Hands-on developer workshops on Flutter, Cloud Architecture, Web Dev, and Machine Learning. Backed by Google Developer experts.",
    memberCount: "480+ members",
    meetingSchedule: "Wednesdays 4:30 PM",
    venue: "Computing Lab 3 & Innovation Hub",
    patronName: "Dr. Evans Ochieng",
    canonicalInterestId: "technology",
    facultyMatches: [
      "School of Computing & Informatics",
      "School of Engineering",
      "Faculty of Science & Technology",
    ],
    tags: ["Mobile", "Cloud", "Web", "AI", "Workshops"],
  },
  {
    id: "cyber-security-pwnzone",
    slug: "cyber-security-pwnzone",
    name: "Cyber Security & PwnZone CTF Guild",
    category: "technology",
    categoryLabel: "Tech & Innovation",
    description:
      "Offensive security, ethical hacking, malware analysis, network packet forensics, and regional Inter-University CTF tournaments.",
    memberCount: "215+ members",
    meetingSchedule: "Fridays 3:00 PM",
    venue: "Cyber Defense Sandbox LT-2",
    patronName: "Eng. Samuel Koech",
    canonicalInterestId: "technology",
    facultyMatches: [
      "School of Computing & Informatics",
      "Faculty of Science & Technology",
    ],
    tags: ["Ethical Hacking", "CTF", "Network Security", "Cryptography"],
  },
  {
    id: "ieee-student-branch",
    slug: "ieee-student-branch",
    name: "IEEE University Student Branch",
    category: "technology",
    categoryLabel: "Tech & Innovation",
    description:
      "World's largest technical professional society. Organizing engineering hackathons, paper publications, and hardware design challenges.",
    memberCount: "165+ members",
    meetingSchedule: "Thursdays 5:00 PM",
    venue: "Electrical Engineering Studio",
    patronName: "Prof. Catherine Ndung'u",
    canonicalInterestId: "technology",
    facultyMatches: [
      "School of Engineering",
      "School of Computing & Informatics",
    ],
    tags: ["Hardware", "Telecom", "Research Papers", "IoT"],
  },
  {
    id: "ai-data-science-hub",
    slug: "ai-data-science-hub",
    name: "Artificial Intelligence & Data Science Hub",
    category: "technology",
    categoryLabel: "Tech & Innovation",
    description:
      "Focusing on deep learning, generative AI, Python predictive analytics, African NLP datasets, and Kaggle data challenges.",
    memberCount: "320+ members",
    meetingSchedule: "Tuesdays 4:00 PM",
    venue: "Data Science Studio LT-4",
    patronName: "Dr. Evans Ochieng",
    canonicalInterestId: "technology",
    facultyMatches: [
      "School of Computing & Informatics",
      "School of Mathematics & Statistics",
      "School of Business",
    ],
    tags: ["Machine Learning", "Python", "Data Analytics", "NLP"],
  },
  {
    id: "robotics-iot-society",
    slug: "robotics-iot-society",
    name: "Robotics & Hardware Systems Society",
    category: "technology",
    categoryLabel: "Tech & Innovation",
    description:
      "Hands-on building with Arduino, Raspberry Pi, automated drones, microcontrollers, and campus smart automation projects.",
    memberCount: "135+ members",
    meetingSchedule: "Saturdays 10:00 AM",
    venue: "Mechatronics Workshop",
    patronName: "Eng. Samuel Koech",
    canonicalInterestId: "technology",
    facultyMatches: [
      "School of Engineering",
      "School of Computing & Informatics",
    ],
    tags: ["Robotics", "Arduino", "Embedded Systems", "Drones"],
  },

  // 2. Sports & Athletics
  {
    id: "varsity-football-club",
    slug: "varsity-football-club",
    name: "University Football Club (Campus League)",
    category: "sports",
    categoryLabel: "Sports & Athletics",
    description:
      "Men's and women's competitive 11-a-side teams competing in Kenya University Sports Association (KUSA) championships.",
    memberCount: "360+ members",
    meetingSchedule: "Daily 4:30 PM",
    venue: "Main Campus Sports Pavilion",
    patronName: "Coach Dan Kiprop",
    canonicalInterestId: "sports",
    tags: ["Football", "KUSA", "Athletics", "Tournaments"],
  },
  {
    id: "rugby-floodies-rfc",
    slug: "rugby-floodies-rfc",
    name: "Summit Varsity Rugby Club (Floodies Circuit)",
    category: "sports",
    categoryLabel: "Sports & Athletics",
    description:
      "Premier varsity 15s and 7s rugby team competing in Impala Floodlit (Floodies), Kenya Cup qualifiers, and KUSA rugby circuit.",
    memberCount: "190+ members",
    meetingSchedule: "Mon, Wed, Fri 4:00 PM",
    venue: "Rugby Pitch & Fitness Gym",
    patronName: "Coach Dan Kiprop",
    canonicalInterestId: "sports",
    tags: ["Rugby 15s", "Rugby 7s", "Floodies", "Strength Training"],
  },
  {
    id: "basketball-hoops-league",
    slug: "basketball-hoops-league",
    name: "Varsity Basketball Association (Hoops)",
    category: "sports",
    categoryLabel: "Sports & Athletics",
    description:
      "Men's and women's elite basketball squads training for national varsity leagues, 3x3 tournaments, and inter-faculty games.",
    memberCount: "230+ members",
    meetingSchedule: "Tue, Thu 4:00 PM",
    venue: "Outdoor Basketball Courts",
    patronName: "Coach Lucy Achieng",
    canonicalInterestId: "sports",
    tags: ["Basketball", "3x3 Tournaments", "Intramurals"],
  },
  {
    id: "athletics-track-club",
    slug: "athletics-track-club",
    name: "Athletics & Track & Field Society",
    category: "sports",
    categoryLabel: "Sports & Athletics",
    description:
      "Short sprints, middle distance, marathon conditioning, relays, and long jump training with certified national trainers.",
    memberCount: "140+ members",
    meetingSchedule: "Mon, Wed, Fri 6:30 AM",
    venue: "Campus Athletics Oval",
    patronName: "Coach Dan Kiprop",
    canonicalInterestId: "sports",
    tags: ["Running", "Sprints", "Marathon", "Track & Field"],
  },
  {
    id: "indoor-games-chess-tabletennis",
    slug: "indoor-games-chess-tabletennis",
    name: "Chess, Table Tennis & Indoor Games Guild",
    category: "sports",
    categoryLabel: "Sports & Athletics",
    description:
      "Competitive chess tournaments, table tennis leagues, badminton, and scrabble championships with weekly campus rankings.",
    memberCount: "195+ members",
    meetingSchedule: "Daily 1:00 PM & 5:00 PM",
    venue: "Student Centre Recreation Hall",
    patronName: "Ms. Janet Korir",
    canonicalInterestId: "sports",
    tags: ["Chess", "Table Tennis", "Badminton", "Scrabble"],
  },

  // 3. Faith & Spiritual Fellowships
  {
    id: "christian-union-cu",
    slug: "christian-union-cu",
    name: "Christian Union (CU - FOCUS Kenya)",
    category: "faith",
    categoryLabel: "Faith & Fellowships",
    description:
      "Inter-denominational evangelical fellowship. Mid-week fellowship, prayer cells, worship nights, high school missions, and discipleship.",
    memberCount: "680+ members",
    meetingSchedule: "Wednesdays 6:00 PM & Sundays 9:00 AM",
    venue: "Main Campus Auditorium",
    patronName: "Rev. Dr. Isaac Mutisya",
    canonicalInterestId: "faith",
    tags: ["Fellowship", "Missions", "Worship Choir", "Discipleship"],
  },
  {
    id: "catholic-students-association-csa",
    slug: "catholic-students-association-csa",
    name: "Catholic Students Association (CSA St. Thomas Aquinas)",
    category: "faith",
    categoryLabel: "Faith & Fellowships",
    description:
      "Sunday Holy Mass, catechism classes, liturgical choir rehearsals, retreat camps, and charity visits to children's homes.",
    memberCount: "430+ members",
    meetingSchedule: "Sundays 10:30 AM & Thursdays 5:00 PM",
    venue: "Campus Chapel & Hall 2",
    patronName: "Fr. Patrick Mwangi",
    canonicalInterestId: "faith",
    tags: ["Holy Mass", "Choir", "Retreats", "Outreach"],
  },
  {
    id: "sda-student-movement",
    slug: "sda-student-movement",
    name: "Seventh-Day Adventist Fellowship (SDA Student Movement)",
    category: "faith",
    categoryLabel: "Faith & Fellowships",
    description:
      "Sabbath divine service, Sabbath school, vocal choir, health lifestyle ministries, and youth leadership training.",
    memberCount: "290+ members",
    meetingSchedule: "Saturdays 8:30 AM - 5:00 PM",
    venue: "Science Complex Lecture Theatre 1",
    patronName: "Elder David Ondieki",
    canonicalInterestId: "faith",
    tags: ["Sabbath Worship", "Vocal Chorale", "Health Ministry"],
  },
  {
    id: "muslim-students-association-msa",
    slug: "muslim-students-association-msa",
    name: "Muslim Students Association (MSA)",
    category: "faith",
    categoryLabel: "Faith & Fellowships",
    description:
      "Friday Juma'ah prayers, Islamic Halaqah study circles, annual Ramadan Iftar feasts, Da'wah drives, and student welfare support.",
    memberCount: "320+ members",
    meetingSchedule: "Fridays 12:30 PM & Tuesdays 4:00 PM",
    venue: "University Mosque & Prayer Room",
    patronName: "Sheikh Abdulrahman Omar",
    canonicalInterestId: "faith",
    tags: ["Juma'ah", "Halaqah", "Ramadan Iftar", "Welfare"],
  },
  {
    id: "pentecostal-students-fellowship",
    slug: "pentecostal-students-fellowship",
    name: "Pentecostal Students Fellowship (PSF)",
    category: "faith",
    categoryLabel: "Faith & Fellowships",
    description:
      "Vibrant spirit-filled praise and worship, revival conferences, prayer chains, and gospel evangelism outreaches.",
    memberCount: "370+ members",
    meetingSchedule: "Tuesdays & Fridays 5:30 PM",
    venue: "Student Centre Amphitheatre",
    patronName: "Pastor Grace Wanjiku",
    canonicalInterestId: "faith",
    tags: ["Praise & Worship", "Revival", "Evangelism"],
  },

  // 4. Arts, Media & Culture
  {
    id: "traveling-theater-troupe",
    slug: "traveling-theater-troupe",
    name: "Traveling Theater Troupe & Drama Club",
    category: "arts",
    categoryLabel: "Arts & Culture",
    description:
      "Stage plays, spoken word poetry, Kenya National Drama Festival productions, monologue coaching, and stand-up comedy nights.",
    memberCount: "185+ members",
    meetingSchedule: "Mon, Wed 5:00 PM",
    venue: "Performing Arts Theatre LT-3",
    patronName: "Ms. Linda Moraa",
    canonicalInterestId: "arts",
    facultyMatches: ["School of Humanities", "School of Media & Communication"],
    tags: ["Drama Festival", "Spoken Word", "Acting", "Directing"],
  },
  {
    id: "campus-press-chronicle",
    slug: "campus-press-chronicle",
    name: "The Campus Chronicle & Digital Media Guild",
    category: "arts",
    categoryLabel: "Arts & Culture",
    description:
      "Student-run investigative campus journalism, podcast production, news broadcasts, op-eds, and digital photography coverage.",
    memberCount: "145+ members",
    meetingSchedule: "Thursdays 4:00 PM",
    venue: "Media Studio & Radio Station Lab",
    patronName: "Mr. Kennedy Otieno",
    canonicalInterestId: "arts",
    facultyMatches: [
      "School of Media & Communication",
      "School of Humanities",
      "School of Law",
    ],
    tags: ["Journalism", "Podcasting", "Photography", "Publishing"],
  },
  {
    id: "university-chorale-band",
    slug: "university-chorale-band",
    name: "University Chorale & Brass Band",
    category: "arts",
    categoryLabel: "Arts & Culture",
    description:
      "Classical choral harmonies, brass band instrumentals, graduation ceremony performances, and regional music festivals.",
    memberCount: "220+ members",
    meetingSchedule: "Tue, Thu 5:30 PM",
    venue: "Music Conservatory Studio",
    patronName: "Dr. Bernard Kimani",
    canonicalInterestId: "music",
    tags: ["Orchestra", "Brass Band", "Choral Music", "Instruments"],
  },
  {
    id: "debate-model-un-society",
    slug: "debate-model-un-society",
    name: "Debate, Oratorical & Model UN Society",
    category: "arts",
    categoryLabel: "Arts & Culture",
    description:
      "British Parliamentary debate tournaments, East African Model United Nations (EAMUN), diplomatic public speaking, and legal mooting.",
    memberCount: "190+ members",
    meetingSchedule: "Wednesdays 5:00 PM",
    venue: "Law Faculty Moot Court LT-1",
    patronName: "Adv. Christine Nekesa",
    canonicalInterestId: "leadership",
    facultyMatches: [
      "School of Law",
      "School of Business",
      "School of Humanities",
    ],
    tags: ["Debate", "Model UN", "Public Speaking", "Diplomacy"],
  },

  // 5. Community Service & Leadership
  {
    id: "kenya-red-cross-chapter",
    slug: "kenya-red-cross-chapter",
    name: "Kenya Red Cross Society (University Chapter)",
    category: "community_service",
    categoryLabel: "Civic & Community",
    description:
      "Certified first aid certification, campus emergency response teams, blood donation drives, and disaster risk management.",
    memberCount: "520+ members",
    meetingSchedule: "Tuesdays 4:30 PM",
    venue: "Student Health Pavilion",
    patronName: "Ms. Janet Korir",
    canonicalInterestId: "community_service",
    facultyMatches: ["School of Health Sciences", "School of Nursing"],
    tags: ["First Aid", "Blood Donation", "Emergency Care", "Volunteering"],
  },
  {
    id: "rotaract-club",
    slug: "rotaract-club",
    name: "Rotaract Club of Summit Metropolitan",
    category: "community_service",
    categoryLabel: "Civic & Community",
    description:
      "Rotary International youth affiliate focusing on community water projects, slum sanitation drives, career mentoring, and leadership.",
    memberCount: "240+ members",
    meetingSchedule: "Thursdays 5:30 PM",
    venue: "Business School Conference Room",
    patronName: "Dr. Peter Kamau",
    canonicalInterestId: "community_service",
    facultyMatches: ["School of Business", "School of Economics"],
    tags: ["Community Outreach", "Professional Mentorship", "Rotary"],
  },
  {
    id: "green-campus-sustainability",
    slug: "green-campus-sustainability",
    name: "Green Campus Environmental Society",
    category: "community_service",
    categoryLabel: "Civic & Community",
    description:
      "Campus tree planting, organic vegetable gardens, plastic bottle recycling initiatives, solar energy awareness, and climate advocacy.",
    memberCount: "195+ members",
    meetingSchedule: "Saturdays 9:00 AM",
    venue: "Botanical Research Gardens",
    patronName: "Dr. Mary Wambui",
    canonicalInterestId: "environment",
    facultyMatches: ["School of Agriculture", "School of Natural Sciences"],
    tags: ["Climate Action", "Recycling", "Tree Planting", "Sustainability"],
  },
  {
    id: "presidents-award-kenya",
    slug: "presidents-award-kenya",
    name: "President's Award - Kenya (PA-K Society)",
    category: "leadership",
    categoryLabel: "Leadership",
    description:
      "Duke of Edinburgh international youth award program: mountain expeditions (Mt. Kenya), skills development, community service, and physical recreation.",
    memberCount: "130+ members",
    meetingSchedule: "Fridays 4:00 PM",
    venue: "Scouts & Expedition Pavilion",
    patronName: "Mr. Patrick Mutua",
    canonicalInterestId: "leadership",
    tags: ["Wilderness Expeditions", "Gold Award", "Leadership Skills"],
  },
  {
    id: "aiesec-leadership-chapter",
    slug: "aiesec-leadership-chapter",
    name: "AIESEC Youth Global Leadership Chapter",
    category: "leadership",
    categoryLabel: "Leadership",
    description:
      "International student-run leadership exchange facilitating global volunteer internships, cross-cultural conferences, and corporate youth forums.",
    memberCount: "175+ members",
    meetingSchedule: "Mondays 5:00 PM",
    venue: "International Relations Hall",
    patronName: "Dr. Peter Kamau",
    canonicalInterestId: "leadership",
    facultyMatches: [
      "School of Business",
      "School of Economics",
      "School of Humanities",
    ],
    tags: ["Global Exchange", "Internships", "SDGs", "Leadership"],
  },

  // 6. Academic & Professional Associations
  {
    id: "computing-students-association-cssa",
    slug: "computing-students-association-cssa",
    name: "Computing & IT Students Association (CSSA)",
    category: "academic",
    categoryLabel: "Academic & Professional",
    description:
      "Official departmental association uniting all Computer Science, BBIT, and Software Engineering majors for industry fairs and hack days.",
    memberCount: "570+ members",
    meetingSchedule: "Alternate Wednesdays 3:00 PM",
    venue: "Main Auditorium LT-1",
    patronName: "Prof. Catherine Ndung'u",
    canonicalInterestId: "technology",
    facultyMatches: ["School of Computing & Informatics"],
    tags: ["Computer Science", "BBIT", "Alumni Mentorship", "Career Days"],
  },
  {
    id: "business-finance-leaders-forum",
    slug: "business-finance-leaders-forum",
    name: "Business & Finance Leaders Forum (BFLF)",
    category: "academic",
    categoryLabel: "Academic & Professional",
    description:
      "Stock market investment simulations (NSE), CFA prep circles, financial modeling bootcamps, and entrepreneurship venture incubators.",
    memberCount: "430+ members",
    meetingSchedule: "Wednesdays 4:00 PM",
    venue: "School of Business Lecture Hall A",
    patronName: "Dr. Peter Kamau",
    canonicalInterestId: "entrepreneurship",
    facultyMatches: ["School of Business", "School of Economics"],
    tags: ["Stock Market", "Fintech", "Entrepreneurship", "CFA"],
  },
  {
    id: "engineering-students-guild",
    slug: "engineering-students-guild",
    name: "Engineering Students Guild (ESG Kenya)",
    category: "academic",
    categoryLabel: "Academic & Professional",
    description:
      "Civil, mechanical, and electrical engineering student chapter conducting industrial site visits, AutoCAD workshops, and patent development.",
    memberCount: "310+ members",
    meetingSchedule: "Fridays 4:00 PM",
    venue: "Engineering Complex Workshop 1",
    patronName: "Eng. Samuel Koech",
    canonicalInterestId: "technology",
    facultyMatches: ["School of Engineering"],
    tags: ["Civil", "Mechanical", "Electrical", "AutoCAD", "Site Visits"],
  },
  {
    id: "health-sciences-nursing-guild",
    slug: "health-sciences-nursing-guild",
    name: "Health Sciences & Nursing Guild",
    category: "academic",
    categoryLabel: "Academic & Professional",
    description:
      "Peer clinical simulations, medical research circles, health screening camps, and hospital residency preparation.",
    memberCount: "280+ members",
    meetingSchedule: "Tuesdays 5:00 PM",
    venue: "Health Sciences Auditorium",
    patronName: "Dr. Mary Wambui",
    canonicalInterestId: "health",
    facultyMatches: ["School of Health Sciences", "School of Nursing"],
    tags: ["Clinical Skills", "Public Health", "Medical Brigades"],
  },
  {
    id: "law-moot-court-society",
    slug: "law-moot-court-society",
    name: "Law Students & Moot Court Society",
    category: "academic",
    categoryLabel: "Academic & Professional",
    description:
      "Appellate mock litigation, human rights legal aid clinics, constitutional jurisprudence symposia, and Philip C. Jessup Moot preparation.",
    memberCount: "205+ members",
    meetingSchedule: "Thursdays 3:30 PM",
    venue: "Moot Courtroom LT-1",
    patronName: "Adv. Christine Nekesa",
    canonicalInterestId: "leadership",
    facultyMatches: ["School of Law"],
    tags: ["Moot Court", "Litigation", "Human Rights", "Legal Aid"],
  },
];

export const CAREER_ALERT_TRACKS = [
  {
    id: "software_engineering",
    title: "Software Engineering & Tech Internships",
    description: "Google ADC, Safaricom, Microsoft, Equity, and leading African tech startups.",
    badge: "Tech & Coding",
    canonicalInterestId: "technology",
  },
  {
    id: "management_trainee",
    title: "Corporate Management Trainee & Banking",
    description: "Big 4 accounting firms, KCB, Equity Bank, Unilever, and management consulting.",
    badge: "Corporate & Finance",
    canonicalInterestId: "entrepreneurship",
  },
  {
    id: "data_ai_analytics",
    title: "Data Science, AI & Machine Learning Roles",
    description: "Business intelligence, predictive modeling, data pipelines, and analytics fellowships.",
    badge: "Data & STEM",
    canonicalInterestId: "technology",
  },
  {
    id: "research_grants",
    title: "Undergraduate Research Grants & Fellowships",
    description: "Funded postgraduate scholarships, research conferences, and innovation lab stipends.",
    badge: "Academic & Grants",
    canonicalInterestId: "academic",
  },
  {
    id: "hackathons_competitions",
    title: "Inter-Varsity Hackathons & Pitch Competitions",
    description: "Buildathons, startup grant challenges, and university innovation prize rounds.",
    badge: "Innovation",
    canonicalInterestId: "technology",
  },
  {
    id: "media_creative_gigs",
    title: "Digital Media, Journalism & Creative Gigs",
    description: "Content production, multimedia design, campus reporting, and digital marketing fellowships.",
    badge: "Creative & Media",
    canonicalInterestId: "arts",
  },
];

export const NOTIFICATION_STYLE_OPTIONS = [
  {
    id: "smart_digest",
    title: "Smart Daily Digest (Recommended)",
    description:
      "Emergency P1 alerts instant; non-urgent timetables and circulars delivered in a curated 7:30 AM morning brief.",
    isRecommended: true,
  },
  {
    id: "immediate_all",
    title: "Immediate Broadcasts & SMS Alerts",
    description:
      "Real-time notifications for every lecture room change, campus bulletin, and urgent registrar notice.",
    isRecommended: false,
  },
  {
    id: "academic_priority",
    title: "Academic & Exam Priority Only",
    description:
      "Timetable and exam changes instant; campus life and society events grouped into a weekly Friday roundup.",
    isRecommended: false,
  },
];

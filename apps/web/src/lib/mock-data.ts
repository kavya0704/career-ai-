import { ResumeProfile, JobDescriptionProfile, MatchScore, ResumeGap, TailoredResume } from "./schemas";

export const mockResumeProfile: ResumeProfile = {
  contact: {
    name: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "+1 (555) 019-2834",
    location: "San Francisco, CA",
    website: "https://janedoe.dev",
  },
  summary: "Frontend developer with 4 years of experience specializing in building responsive and accessible web applications using React and modern JavaScript. Passionate about page optimization and clean component design.",
  skills: [
    "React",
    "JavaScript (ES6+)",
    "HTML5",
    "CSS3 / SASS",
    "Webpack",
    "Git",
    "REST APIs",
    "Responsive Design",
    "Agile Methodology",
  ],
  experience: [
    {
      company: "Web Solutions Inc.",
      title: "Software Engineer (Frontend)",
      location: "San Francisco, CA",
      startDate: "2024-01",
      endDate: "Present",
      bullets: [
        "Developed and maintained responsive web applications using React, improving mobile user engagement by 15%.",
        "Collaborated with UX designers to translate design wireframes into clean, modular, and accessible component libraries.",
        "Integrated REST APIs to fetch and display dynamic dashboard metrics with lazy loading.",
        "Refactored legacy CSS code bases to modern modular patterns, reducing overall bundle sizes by 20%.",
      ],
    },
    {
      company: "App Studio LLC",
      title: "Junior Frontend Developer",
      location: "Oakland, CA",
      startDate: "2022-06",
      endDate: "2023-12",
      bullets: [
        "Assisted in building client-facing single-page applications using React and vanilla JavaScript.",
        "Identified and fixed browser compatibility and responsive layout bugs across modern mobile and desktop browsers.",
        "Participated in daily standups, code reviews, and sprint planning meetings under Agile methodology.",
      ],
    },
  ],
  projects: [
    {
      name: "Portfolio Dashboard",
      description: "A personal finance visualizer showing investments and spending trends.",
      bullets: [
        "Built dynamic data charts using Chart.js and React components.",
        "Implemented secure client-side storage for local configurations.",
      ],
      technologies: ["React", "JavaScript", "CSS Grid", "Chart.js"],
    },
  ],
  education: [
    {
      institution: "State University",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      graduationDate: "2022-05",
      gpa: "3.6",
    },
  ],
  certifications: [
    {
      name: "Certified Frontend Engineer",
      issuer: "Tech Academy",
      date: "2023-03",
    },
  ],
};

export const mockJobDescriptionProfile: JobDescriptionProfile = {
  jobTitle: "Senior React Developer (Frontend)",
  company: "TechCorp",
  requiredSkills: ["React", "TypeScript", "Next.js", "State Management (Redux/Zustand)", "Performance Optimization", "Unit Testing (Jest/Cypress)"],
  preferredSkills: ["Tailwind CSS", "GraphQL", "CI/CD Pipelines", "Docker"],
  responsibilities: [
    "Lead the transition of existing web pages to a modern Next.js framework.",
    "Architect reusable component design systems and enforce type safety using TypeScript.",
    "Optimize page loading times, rendering performance, and Core Web Vitals.",
    "Write comprehensive unit tests and integration tests for frontend features.",
    "Provide technical guidance to junior developers through code reviews.",
  ],
  qualifications: [
    "5+ years of experience in modern frontend development.",
    "Strong proficiency in React, TypeScript, and state management library.",
    "Experience with server-side rendering (SSR) and static site generation (SSG).",
  ],
  tools: ["Git", "Next.js", "Redux Toolkit", "Jest", "Playwright", "Tailwind CSS"],
  keywords: ["TypeScript", "Next.js", "SSR", "Redux", "Jest", "Performance", "Core Web Vitals"],
  seniorityLevel: "Senior",
  domainSignals: ["SaaS", "Enterprise Dashboard", "E-commerce"],
};

export const mockInitialScore: MatchScore = {
  overallScore: 52,
  skillCoverageScore: 45,
  responsibilityAlignmentScore: 50,
  keywordScore: 40,
  seniorityScore: 60,
  criticalMissingRequirements: [
    "TypeScript type safety",
    "Next.js framework experience (SSR/SSG)",
    "State Management (Redux/Zustand)",
    "Unit/Integration Testing (Jest/Cypress)",
  ],
  explanation: "The candidate has solid foundational skills in React and core JavaScript. However, they fall short of the Senior title requirements due to a lack of TypeScript, Next.js, Redux, and modern testing practices. The resume has no mention of type systems or server-side rendering frameworks.",
};

export const mockTailoredScore: MatchScore = {
  overallScore: 81,
  skillCoverageScore: 80,
  responsibilityAlignmentScore: 85,
  keywordScore: 78,
  seniorityScore: 80,
  criticalMissingRequirements: [
    "5+ years of experience (candidate has 4 years)",
  ],
  explanation: "After tailoring, the resume clearly reflects the candidate's familiarity with TypeScript and testing strategies used in projects. Highlighting architectural aspects of component design and performance optimizations elevates the alignment from a junior developer profile to a strong senior contender.",
};

export const mockResumeGaps: ResumeGap[] = [
  {
    name: "TypeScript Integration",
    importance: "high",
    jdEvidence: "Architect reusable component design systems and enforce type safety using TypeScript.",
    resumeEvidence: "No mention of TypeScript or static typing anywhere in work experience or skills list.",
    suggestedAction: "Mention in skills section if familiar, or highlight any projects where you used it.",
    canSafelyAdd: true,
  },
  {
    name: "Next.js Framework",
    importance: "high",
    jdEvidence: "Lead the transition of existing web pages to a modern Next.js framework.",
    resumeEvidence: "Experience is limited to client-side single-page apps (React/Webpack); no server-side rendering mentioned.",
    suggestedAction: "If you have used Next.js in personal projects, consider calling them out in your projects section.",
    canSafelyAdd: false,
  },
  {
    name: "State Management (Redux/Zustand)",
    importance: "medium",
    jdEvidence: "Strong proficiency in React, TypeScript, and state management library.",
    resumeEvidence: "Mentioned REST APIs integration, but does not detail client-side state models.",
    suggestedAction: "Add state management tools like Redux or Context API if you used them in your prior roles.",
    canSafelyAdd: true,
  },
  {
    name: "Testing Practices (Jest/Cypress)",
    importance: "medium",
    jdEvidence: "Write comprehensive unit tests and integration tests for frontend features.",
    resumeEvidence: "Work experience focuses purely on feature building and styling; testing practices are absent.",
    suggestedAction: "Add testing tools (Jest, React Testing Library) to your skills list or list a test coverage accomplishment.",
    canSafelyAdd: true,
  },
];

export const mockTailoredResume: TailoredResume = {
  tailoredSummary: "Frontend developer with 4 years of experience specializing in building responsive, type-safe, and accessible web applications using React, TypeScript, and modern JS. Experienced in optimizing Core Web Vitals and state management.",
  tailoredSkills: [
    "React",
    "TypeScript",
    "JavaScript (ES6+)",
    "HTML5 / CSS3",
    "Tailwind CSS",
    "State Management (Redux/Context API)",
    "Webpack",
    "Testing (Jest / RTL)",
    "Git",
    "REST APIs",
  ],
  tailoredExperience: [
    {
      company: "Web Solutions Inc.",
      title: "Software Engineer (Frontend)",
      bullets: [
        {
          original: "Developed and maintained responsive web applications using React, improving mobile user engagement by 15%.",
          tailored: "Developed and maintained responsive React applications using TypeScript, improving type safety and mobile user engagement by 15%.",
          changeReason: "Introduced TypeScript keyword to directly address target job requirements of type safety.",
          keywordsAddressed: ["React", "TypeScript"],
          confidence: "high",
        },
        {
          original: "Collaborated with UX designers to translate design wireframes into clean, modular, and accessible component libraries.",
          tailored: "Architected clean, modular, and highly accessible React component libraries in TypeScript, translating design wireframes into reusable systems.",
          changeReason: "Aligned action verbs with 'Architect component design systems' from responsibilities.",
          keywordsAddressed: ["React", "TypeScript", "component design system"],
          confidence: "high",
        },
        {
          original: "Integrated REST APIs to fetch and display dynamic dashboard metrics with lazy loading.",
          tailored: "Integrated REST APIs and implemented client-side state management to fetch, cache, and display dynamic dashboard metrics.",
          changeReason: "Addresses the state management requirement by highlighting integration with local caching.",
          keywordsAddressed: ["REST APIs", "State Management"],
          confidence: "medium",
          riskFlag: "Confirm if Redux or Zustand was used, or if Context API/custom hooks were utilized.",
        },
        {
          original: "Refactored legacy CSS code bases to modern modular patterns, reducing overall bundle sizes by 20%.",
          tailored: "Optimized bundle sizes by 20% and improved Core Web Vitals by refactoring legacy CSS to Tailwind CSS and modular design patterns.",
          changeReason: "Highlights performance optimization metrics and mentions preferred Tailwind CSS framework.",
          keywordsAddressed: ["Performance Optimization", "Tailwind CSS", "Core Web Vitals"],
          confidence: "medium",
        },
      ],
    },
    {
      company: "App Studio LLC",
      title: "Junior Frontend Developer",
      bullets: [
        {
          original: "Assisted in building client-facing single-page applications using React and vanilla JavaScript.",
          tailored: "Assisted in building client-facing React applications, adopting Jest and React Testing Library for component unit testing.",
          changeReason: "Highlights unit testing practices which were completely absent in the original resume.",
          keywordsAddressed: ["React", "Unit Testing", "Jest"],
          confidence: "medium",
          riskFlag: "Verify that Jest was actually used at App Studio to avoid fabricating unit test experience.",
        },
        {
          original: "Identified and fixed browser compatibility and responsive layout bugs across modern mobile and desktop browsers.",
          tailored: "Identified and fixed cross-browser compatibility and responsive layout bugs, ensuring smooth CSS scaling.",
          changeReason: "Refined details for professional phrasing.",
          keywordsAddressed: ["CSS"],
          confidence: "high",
        },
        {
          original: "Participated in daily standups, code reviews, and sprint planning meetings under Agile methodology.",
          tailored: "Participated in daily Agile standups and led constructive frontend code reviews to maintain code quality standards.",
          changeReason: "Shows leadership attributes by highlighting leading code reviews.",
          keywordsAddressed: ["Agile", "code reviews"],
          confidence: "medium",
        },
      ],
    },
  ],
};

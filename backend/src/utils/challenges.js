const challengeBank = {
  'software-development': [
    {
      id: 'swd-001',
      title: 'Bug Squash — Off-by-One',
      description: 'Given a code snippet with an off-by-one error, record yourself identifying and fixing it. Show compile/test output proving the fix.',
      estimatedMinutes: 15
    },
    {
      id: 'swd-002',
      title: 'API Endpoint from Spec',
      description: 'Given an OpenAPI spec snippet, implement the endpoint in your language/framework of choice. Record live coding with git commits.',
      estimatedMinutes: 30
    },
    {
      id: 'swd-003',
      title: 'Refactor Legacy Code',
      description: 'Given a poorly written function, refactor it to be clean and testable. Show tests passing before and after.',
      estimatedMinutes: 25
    }
  ],
  'data-analysis': [
    {
      id: 'da-001',
      title: 'Clean Dirty Dataset',
      description: 'Given a CSV with missing values and inconsistencies, clean it using your tool of choice. Record the process showing decision-making.',
      estimatedMinutes: 20
    },
    {
      id: 'da-002',
      title: 'Build a Dashboard',
      description: 'Given a dataset, build a 3-panel dashboard. Record the full process from exploration to final output.',
      estimatedMinutes: 30
    }
  ],
  'devops': [
    {
      id: 'do-001',
      title: 'Dockerize an App',
      description: 'Dockerize a given application with multi-stage build. Record terminal session showing build and run.',
      estimatedMinutes: 20
    },
    {
      id: 'do-002',
      title: 'CI Pipeline Debug',
      description: 'Given a failing CI config, diagnose and fix it. Record screen showing the debug process.',
      estimatedMinutes: 25
    }
  ],
  'design': [
    {
      id: 'ds-001',
      title: 'Design a Component',
      description: 'Given UI requirements, design a component in your tool of choice. Record time-lapse and explain decisions.',
      estimatedMinutes: 20
    }
  ],
  'general': [
    {
      id: 'gen-001',
      title: 'Teach a Concept',
      description: 'Pick a concept in your skill area and explain it with a live demonstration. Record the full session.',
      estimatedMinutes: 15
    },
    {
      id: 'gen-002',
      title: 'Debug Live',
      description: 'We send you a broken environment/config. Record yourself diagnosing and fixing it live.',
      estimatedMinutes: 20
    }
  ]
};

export function getChallengesForCategory(category) {
  return challengeBank[category] || challengeBank['general'];
}

export function getRandomChallenge(category) {
  const pool = getChallengesForCategory(category);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getChallengeById(id) {
  for (const cat of Object.values(challengeBank)) {
    const found = cat.find(c => c.id === id);
    if (found) return found;
  }
  return null;
}

export function getAllCategories() {
  return Object.keys(challengeBank);
}

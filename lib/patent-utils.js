// 📁 lib/patent-utils.js
// Utility functions for patent processing

export const formatPatentDraft = (data) => {
  const { abstract, priorArt, noveltyAnalysis, claims } = data;
  
  return `
PATENT APPLICATION

TITLE: ${data.title || 'AI-Powered Innovation System'}

FIELD OF THE INVENTION
${data.field || 'The present invention relates to artificial intelligence systems...'}

BACKGROUND OF THE INVENTION
${data.background || 'Current systems in this field suffer from limitations...'}

SUMMARY OF THE INVENTION
${abstract}

DETAILED DESCRIPTION
${data.detailedDescription || 'The invention comprises the following components...'}

CLAIMS
${claims?.map((claim, index) => `${index + 1}. ${claim}`).join('\n') || '1. A system comprising...'}

ABSTRACT
${abstract}
`;
};

export const generateClaims = (noveltyPoints) => {
  return noveltyPoints.map((point, index) => {
    if (index === 0) {
      return `A system for ${point.toLowerCase()}, comprising: [detailed claim structure]`;
    } else {
      return `The system of claim 1, wherein ${point.toLowerCase()}.`;
    }
  });
};

export const calculateNoveltyScore = (priorArt, invention) => {
  // Implement novelty scoring algorithm
  let score = 100;
  
  priorArt.forEach(art => {
    if (art.relevance === 'High') score -= 20;
    else if (art.relevance === 'Medium') score -= 10;
    else score -= 5;
  });
  
  return Math.max(score, 0);
};
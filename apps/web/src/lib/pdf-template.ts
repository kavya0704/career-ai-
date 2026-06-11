/**
 * Generates the HTML markup for the side-by-side comparison proof document.
 */
export function generateComparisonPDFHTML(data: any): string {
  const {
    tailoredResume,
    jobDescriptionProfile,
    initialScore,
    tailoredScore,
    gaps,
  } = data;

  const scoreDelta = tailoredScore.overallScore - initialScore.overallScore;

  const getStrokeColor = (score: number) => {
    if (score >= 70) return "#16a34a"; // green-600
    if (score >= 40) return "#d97706"; // amber-600
    return "#dc2626"; // red-600
  };

  // Render experience bullet rows
  const experienceRows = tailoredResume.tailoredExperience.map((exp: any) => {
    const bulletRows = exp.bullets.map((b: any) => `
      <tr class="border-b border-gray-100">
        <td class="w-1/2 p-3 text-xs text-gray-600 align-top leading-relaxed border-r border-gray-100">
          ${b.original}
        </td>
        <td class="w-1/2 p-3 text-xs text-gray-800 align-top leading-relaxed">
          ${highlightDiffHTML(b.original, b.tailored)}
          ${b.riskFlag ? `<div class="mt-2 p-2 bg-red-50 text-[10px] text-red-700 border border-red-200 rounded"><strong>Warning:</strong> ${b.riskFlag}</div>` : ""}
        </td>
      </tr>
    `).join("");

    return `
      <div class="mb-6 border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div class="bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
          <span class="text-sm font-bold text-gray-800">${exp.company}</span>
          <span class="text-xs text-gray-500 font-medium">${exp.title}</span>
        </div>
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-gray-50/50 border-b border-gray-100 text-[10px] text-gray-500 uppercase tracking-wider">
              <th class="w-1/2 p-2 text-left border-r border-gray-100 font-semibold">Original Bullet</th>
              <th class="w-1/2 p-2 text-left font-semibold">Tailored Bullet</th>
            </tr>
          </thead>
          <tbody>
            ${bulletRows}
          </tbody>
        </table>
      </div>
    `;
  }).join("");

  // Render gaps table rows
  const gapRows = gaps.map((gap: any) => `
    <tr class="border-b border-gray-100 text-xs">
      <td class="p-3 font-semibold text-gray-800 border-r border-gray-100">
        ${gap.name}
        ${gap.canSafelyAdd ? `<span class="ml-1 text-[9px] font-bold text-green-700 bg-green-50 px-1 py-0.5 rounded border border-green-200">Quick Add</span>` : ""}
      </td>
      <td class="p-3 text-[10px] font-semibold uppercase ${gap.importance === 'high' ? 'text-red-600' : gap.importance === 'medium' ? 'text-amber-600' : 'text-gray-500'} border-r border-gray-100">
        ${gap.importance}
      </td>
      <td class="p-3 text-gray-600 border-r border-gray-100">
        ${gap.jdEvidence}
      </td>
      <td class="p-3 text-gray-700 font-medium">
        ${gap.suggestedAction}
      </td>
    </tr>
  `).join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Resume Tailoring Comparison Proof</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
      </style>
    </head>
    <body class="bg-gray-50 p-8">
      <div class="max-w-4xl mx-auto bg-white border border-gray-200 p-8 rounded-xl shadow-sm">
        
        <!-- Header -->
        <div class="border-b border-gray-200 pb-6 mb-6 flex justify-between items-start">
          <div>
            <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">Resume Alignment Proof</h1>
            <p class="text-sm text-gray-500 mt-1">Target Role: <strong>${jobDescriptionProfile.jobTitle}</strong> at <strong>${jobDescriptionProfile.company || "Unspecified"}</strong></p>
          </div>
          <div class="text-right text-[10px] text-gray-400">
            Generated via Resume Shapeshifter
          </div>
        </div>

        <!-- Scores Grid -->
        <div class="grid grid-cols-3 gap-4 border border-gray-200 rounded-xl p-4 bg-gray-50 mb-8">
          <!-- Original Score Gauge -->
          <div class="flex flex-col items-center justify-center border-r border-gray-200">
            <span class="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-2 font-semibold">Original Match</span>
            <div style="position: relative; display: flex; align-items: center; justify-content: center; height: 75px; width: 75px;">
              <svg style="height: 100%; width: 100%; transform: rotate(-90deg);">
                <circle cx="37.5" cy="37.5" r="28" stroke="#e5e7eb" stroke-width="5" fill="transparent" />
                <circle cx="37.5" cy="37.5" r="28" stroke="${getStrokeColor(initialScore.overallScore)}" stroke-width="5" fill="transparent" stroke-dasharray="175.93" stroke-dashoffset="${(1 - initialScore.overallScore / 100) * 175.93}" stroke-linecap="round" />
              </svg>
              <div style="position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span style="font-size: 16px; font-weight: 800; color: #1f2937;">${initialScore.overallScore}</span>
              </div>
            </div>
          </div>

          <!-- Improve Delta -->
          <div class="flex flex-col items-center justify-center">
            <span class="text-[9px] uppercase font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full shadow-sm font-semibold">
              +${scoreDelta} Improvement
            </span>
          </div>

          <!-- Tailored Score Gauge -->
          <div class="flex flex-col items-center justify-center border-l border-gray-200">
            <span class="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-2 font-semibold">Tailored Match</span>
            <div style="position: relative; display: flex; align-items: center; justify-content: center; height: 75px; width: 75px;">
              <svg style="height: 100%; width: 100%; transform: rotate(-90deg);">
                <circle cx="37.5" cy="37.5" r="28" stroke="#e5e7eb" stroke-width="5" fill="transparent" />
                <circle cx="37.5" cy="37.5" r="28" stroke="${getStrokeColor(tailoredScore.overallScore)}" stroke-width="5" fill="transparent" stroke-dasharray="175.93" stroke-dashoffset="${(1 - tailoredScore.overallScore / 100) * 175.93}" stroke-linecap="round" />
              </svg>
              <div style="position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span style="font-size: 16px; font-weight: 800; color: #1f2937;">${tailoredScore.overallScore}</span>
              </div>
          </div>
        </div>

        <!-- JD Requirements Summary -->
        <div class="mb-8 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <div class="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
            <h2 class="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Job Description Requirements Summary</h2>
          </div>
          <div class="p-4 grid grid-cols-2 gap-6">
            <!-- Skills Badges -->
            <div>
              <h3 class="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2 font-semibold">Key Skills Required</h3>
              <div class="flex flex-wrap gap-1.5">
                ${(jobDescriptionProfile.requiredSkills || []).map((s: string) => `
                  <span class="bg-gray-100 text-gray-800 text-[10px] px-2 py-0.5 rounded border border-gray-200 font-medium">${s}</span>
                `).join("")}
                ${(jobDescriptionProfile.preferredSkills && jobDescriptionProfile.preferredSkills.length > 0) 
                  ? jobDescriptionProfile.preferredSkills.map((s: string) => `
                    <span class="bg-blue-50 text-blue-800 text-[10px] px-2 py-0.5 rounded border border-blue-200 font-medium">${s} (Preferred)</span>
                  `).join("")
                  : ""
                }
              </div>
            </div>
            <!-- Responsibilities Checklist -->
            <div>
              <h3 class="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2 font-semibold">Core Responsibilities</h3>
              <ul class="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
                ${(jobDescriptionProfile.responsibilities || []).slice(0, 5).map((r: string) => `
                  <li>${r}</li>
                `).join("")}
              </ul>
            </div>
          </div>
        </div>

        <!-- Section: Experience Diff -->
        <div class="mb-8">
          <h2 class="text-base font-extrabold text-gray-900 mb-4 uppercase tracking-wider text-xs">Work Experience Bullet Tailoring</h2>
          ${experienceRows}
        </div>

        <!-- Section: Gaps -->
        <div class="mb-8 border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div class="bg-gray-50 border-b border-gray-200 px-4 py-2">
            <h2 class="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Remaining Gaps & Actions</h2>
          </div>
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                <th class="p-2 text-left border-r border-gray-100 w-1/4">Requirement</th>
                <th class="p-2 text-left border-r border-gray-100 w-[15%]">Priority</th>
                <th class="p-2 text-left border-r border-gray-100 w-1/3">Evidence</th>
                <th class="p-2 text-left">Suggested Action</th>
              </tr>
            </thead>
            <tbody>
              ${gapRows}
            </tbody>
          </table>
        </div>

        <!-- Footer Disclaimer -->
        <div class="border-t border-gray-200 pt-6 mt-12 text-center text-[10px] text-gray-400">
          <p class="font-semibold uppercase tracking-wider text-red-600/70 mb-1">Verify Before Sharing</p>
          <p>Disclaimer: This document is an alignment proof. Review all tailored statements for truthfulness prior to submitting your resume to employers. Do not claim skills or tools you do not possess.</p>
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Generates the HTML markup for a clean, professional tailored resume (no comparison diffs).
 */
export function generateCleanResumePDFHTML(data: any): string {
  const { resumeProfile, tailoredResume } = data;

  const skillsList = tailoredResume.tailoredSkills.map((s: string) => `
    <span class="bg-gray-100 text-gray-800 text-[11px] px-2 py-0.5 rounded border border-gray-200 font-medium">${s}</span>
  `).join("");

  const experienceSection = tailoredResume.tailoredExperience.map((exp: any) => {
    const originalExp = resumeProfile.experience.find(
      (e: any) => e.company.toLowerCase() === exp.company.toLowerCase()
    );

    const bulletsList = exp.bullets.map((b: any) => `
      <li class="mb-1.5 pl-1 leading-relaxed">${b.tailored}</li>
    `).join("");

    return `
      <div class="mb-4">
        <div class="flex justify-between items-baseline mb-1">
          <h3 class="text-sm font-bold text-gray-800">${exp.company}</h3>
          <span class="text-xs text-gray-500 font-medium">${originalExp?.startDate || ""} - ${originalExp?.endDate || "Present"}</span>
        </div>
        <div class="text-xs font-semibold text-gray-600 mb-2 italic">${exp.title}</div>
        <ul class="list-disc pl-4 text-xs text-gray-700 space-y-1">
          ${bulletsList}
        </ul>
      </div>
    `;
  }).join("");

  const educationSection = resumeProfile.education.map((edu: any) => `
    <div class="flex justify-between items-baseline mb-1 text-xs">
      <div>
        <strong>${edu.institution}</strong> - ${edu.degree} ${edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
      </div>
      <div class="text-gray-500">${edu.graduationDate || ""}</div>
    </div>
  `).join("");

  const projectsSection = resumeProfile.projects && resumeProfile.projects.length > 0
    ? `
      <div class="border-t border-gray-200 pt-4 mb-6">
        <h2 class="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Key Projects</h2>
        ${resumeProfile.projects.map((proj: any) => `
          <div class="mb-3">
            <div class="flex justify-between items-baseline mb-1">
              <h3 class="text-xs font-bold text-gray-800">${proj.name}</h3>
              ${proj.technologies ? `<span class="text-[10px] text-gray-500">Tech: ${proj.technologies.join(", ")}</span>` : ""}
            </div>
            <ul class="list-disc pl-4 text-xs text-gray-700 space-y-0.5">
              ${proj.bullets.map((b: string) => `<li>${b}</li>`).join("")}
            </ul>
          </div>
        `).join("")}
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${resumeProfile.contact.name} - Tailored Resume</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
      </style>
    </head>
    <body class="bg-white p-12">
      <div class="max-w-3xl mx-auto">
        
        <!-- Header Info -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900 leading-tight">${resumeProfile.contact.name}</h1>
          <div class="text-xs text-gray-500 mt-1.5 flex justify-center gap-3 flex-wrap">
            ${resumeProfile.contact.email ? `<span>${resumeProfile.contact.email}</span>` : ""}
            ${resumeProfile.contact.phone ? `<span>|</span> <span>${resumeProfile.contact.phone}</span>` : ""}
            ${resumeProfile.contact.location ? `<span>|</span> <span>${resumeProfile.contact.location}</span>` : ""}
            ${resumeProfile.contact.website ? `<span>|</span> <a href="${resumeProfile.contact.website}" class="underline">${resumeProfile.contact.website}</a>` : ""}
          </div>
        </div>

        <!-- Summary -->
        ${tailoredResume.tailoredSummary
          ? `
            <div class="border-t border-gray-200 pt-4 mb-6 text-xs text-gray-700 leading-relaxed">
              <p>${tailoredResume.tailoredSummary}</p>
            </div>
          `
          : ""
        }

        <!-- Skills -->
        <div class="border-t border-gray-200 pt-4 mb-6">
          <h2 class="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Core Competencies & Skills</h2>
          <div class="flex flex-wrap gap-2">
            ${skillsList}
          </div>
        </div>

        <!-- Experience -->
        <div class="border-t border-gray-200 pt-4 mb-6">
          <h2 class="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Professional Experience</h2>
          ${experienceSection}
        </div>

        <!-- Projects -->
        ${projectsSection}

        <!-- Education -->
        <div class="border-t border-gray-200 pt-4 mb-6">
          <h2 class="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Education</h2>
          ${educationSection}
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Word level diff generator that highlights added/modified words.
 */
function highlightDiffHTML(original: string, tailored: string): string {
  if (original === tailored) return tailored;

  const originalWords = new Set(
    original
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .split(/\s+/)
  );

  const tailoredWords = tailored.split(/\s+/);

  return tailoredWords.map(word => {
    const cleanWord = word
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

    const isNew = cleanWord && !originalWords.has(cleanWord);

    if (isNew) {
      return `<mark class="bg-green-100 text-green-800 font-semibold px-0.5 rounded border border-green-200">${word}</mark>`;
    }
    return ` ${word} `;
  }).join("");
}

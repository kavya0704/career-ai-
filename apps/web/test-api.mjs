async function test() {
  const payload = {
    resumeText: "Jane Doe Resume Text: Software Engineer (Frontend) at Web Solutions Inc., Junior Frontend Developer at App Studio LLC. Skills: React, JavaScript, HTML, CSS, Git. Education: BS in CS from State University.",
    jdText: "Senior React Developer (Frontend) at TechCorp. Must have React, TypeScript, Next.js, Redux, Tailwind CSS, Jest, Playwright. Responsibilities include building component design systems, optimization, and unit testing."
  };

  try {
    console.log("Sending POST request to http://localhost:3000/api/analyze...");
    const response = await fetch("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("Response Status:", response.status);
    const data = await response.json();
    if (!response.ok) {
      console.error("API Error Response:", JSON.stringify(data, null, 2));
    } else {
      console.log("API Success Response (keys):", Object.keys(data));
      console.log("Initial Score:", data.initialScore);
    }
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

test();

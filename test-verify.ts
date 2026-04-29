

const VERIFY_MN_BASE_URL = "https://api.verify.mn";

async function test() {
  const apiKey = process.env.VERIFY_MN_API_KEY;
  console.log("API Key:", apiKey);
  
  // Create a session
  console.log("Creating session...");
  const createRes = await fetch(`${VERIFY_MN_BASE_URL}/sessions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: "99112233",
      text: "1234",
      callback: "http://localhost:3000/api/verify-mn/callback",
    }),
  });
  
  const createText = await createRes.text();
  console.log("Create Status:", createRes.status);
  console.log("Create Response:", createText);
  
  if (!createRes.ok) return;
  const data = JSON.parse(createText);
  const sessionId = data.sessionId;
  
  // Check session
  console.log("Checking session:", sessionId);
  const checkRes = await fetch(`${VERIFY_MN_BASE_URL}/sessions/${sessionId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });
  
  const checkText = await checkRes.text();
  console.log("Check Status:", checkRes.status);
  console.log("Check Response:", checkText);
}

test();

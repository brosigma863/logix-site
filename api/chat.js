module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const userMessage = req.body.message;
    
    // The hidden instructions for the Logix AI
    const systemInstruction = `You are the Logix Project Assistant for logixlabs.in. 
    Your job is to brainstorm custom hardware gadgets (using ESP32, Raspberry Pi, custom boards, sensors) 
    based on the user's hobbies or business. Keep answers brief, friendly, and practical. 
    Always end by asking if they want to send this idea to the engineering quote form.`;

    // Vercel securely injects your API key here
    const apiKey = process.env.GEMINI_API_KEY; 
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: [{ role: "user", parts: [{ text: userMessage }] }]
            })
        });

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;
        
        res.status(200).json({ reply: aiText });
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Failed to generate idea" });
    }
}

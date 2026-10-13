module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const userMessage = req.body.message;
    
    // Instruct the AI to output exactly two separate fields
    const systemInstruction = `You are the Logix Project Assistant. Brainstorm custom hardware gadgets (using ESP32, Pi, sensors). 
    You MUST return your response as a valid JSON object with exactly two keys:
    1. "chatMessage": A brief, friendly conversational response to the user. End by asking if they want to send it to the quote form.
    2. "quoteDetails": A strict, bulleted list of ONLY the project name, parts needed, and core logic/functionality. No conversational filler.`;

    const apiKey = process.env.GEMINI_API_KEY; 
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: [{ role: "user", parts: [{ text: userMessage }] }],
                // This forces Google's API to return perfect JSON
                generationConfig: { responseMimeType: "application/json" } 
            })
        });

        const data = await response.json();
        
        let frontendReply = "I couldn't quite process that. Could you try rephrasing?";
        let formDetails = "";
        
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            // Read the JSON string the AI generated and convert it into variables
            const aiJsonString = data.candidates[0].content.parts[0].text;
            try {
                const parsedAi = JSON.parse(aiJsonString);
                frontendReply = parsedAi.chatMessage;
                formDetails = parsedAi.quoteDetails;
            } catch (e) {
                console.error("JSON Parsing Error");
            }
        } else if (data.error) {
            frontendReply = "System Offline: The AI model is currently unavailable.";
        }
        
        // Send BOTH pieces of text back to your website
        res.status(200).json({ reply: frontendReply, quote_details: formDetails });
    } catch (error) {
        console.error("Vercel Server Error:", error);
        res.status(500).json({ error: "Failed to generate idea" });
    }
}

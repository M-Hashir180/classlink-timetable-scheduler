const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Get API key from environment variable (Vercel will set this)
const API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
    console.error('❌ OPENROUTER_API_KEY is not set!');
    // Don't exit, just log the error for serverless environment
}

app.post('/parse', async (req, res) => {
    try {
        const { imageBase64, prompt } = req.body;

        if (!API_KEY) {
            throw new Error('OpenRouter API key is not configured');
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://classlink-timetable-scheduler.vercel.app",
                "X-Title": "ClassLink Timetable Scheduler"
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageBase64}`
                                }
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenRouter API Error:', errorData);
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content || "";

        res.json({
            candidates: [
                {
                    content: {
                        parts: [
                            { text: rawText }
                        ]
                    }
                }
            ]
        });

    } catch (err) {
        console.error('Server Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// For Vercel serverless deployment
module.exports = app;

// For local development (optional)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
        console.log(`🎯 Using OpenRouter API with GPT-4o Mini`);
    });
}

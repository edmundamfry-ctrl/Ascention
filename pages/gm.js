export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const { messages, systemPrompt } = req.body
  if (!messages || !systemPrompt) return res.status(400).json({ error: 'Missing messages or systemPrompt' })

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://ascension.vercel.app',
        'X-Title': 'Ascension',
      },
      body: JSON.stringify({
        // Swap this one string to try other models:
        //   'google/gemini-2.0-flash-001'
        //   'x-ai/grok-2-1212'
        //   'anthropic/claude-3.5-haiku'
        model: 'deepseek/deepseek-chat',
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    })

    const data = await response.json()
    if (data.error) return res.status(500).json({ error: data.error.message || JSON.stringify(data.error) })

    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) return res.status(500).json({ error: 'Empty response from model' })

    res.status(200).json({ text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

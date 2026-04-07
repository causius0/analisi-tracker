# AI Features Quick Start

## What's New in v2.0

Analisi Tracker now includes **AI-powered features** that make understanding your health data easier than ever:

- 🗣️ **Natural Language Chat** - Ask questions in plain English
- 📊 **Health Summaries** - Get easy-to-understand summaries of your results
- 📄 **PDF Extraction** - Upload lab results as PDFs and auto-extract data
- 🔮 **Prediction Explanations** - Understand what your future values might mean
- ⚠️ **Anomaly Explanations** - Learn what abnormal values mean for your health
- 💊 **Medication Analysis** - See how medications might affect your lab values

## Quick Setup

### 1. Get an API Key

Choose a provider:

**Option A: OpenAI (Recommended)**
1. Go to https://platform.openai.com/api-keys
2. Create an API key
3. Add to `.env`: `OPENAI_API_KEY=sk-...`
4. Cost: ~$0.01-0.10 per request

**Option B: Anthropic**
1. Go to https://console.anthropic.com/
2. Create an API key
3. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`
4. Cost: ~$0.02-0.15 per request

### 2. Configure Environment

Create a `.env` file:

```bash
# Copy from .env.example
cp .env.example .env

# Edit .env and add your API key
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

### 3. Start the Server

```bash
npm start
```

That's it! AI features are now enabled.

## Usage Examples

### Chat Interface

Ask questions about your health data:

```javascript
// Send a message
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Show me my creatinine trends over the last 6 months"
  })
});

const data = await response.json();
console.log(data.response);
// "Based on your last 8 creatinine measurements, your kidney function has been improving..."
```

**Try these questions:**
- "What's my average glucose?"
- "Compare my cholesterol to last year"
- "Which values are out of range?"
- "Explain what eGFR measures"
- "How are my creatinine and eGFR related?"

### Health Summary

Generate a comprehensive summary:

```javascript
const response = await fetch('/api/ai/summary', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patientId: 'sample',
    includeTrends: true,
    includeAnomalies: true
  })
});

const data = await response.json();
console.log(data.summary);
// # Health Summary
// ## Overall Status
// Your kidney function is showing positive trends...
```

### PDF Extraction

Extract lab values from a PDF:

```javascript
// Read PDF file
const pdfBuffer = fs.readFileSync('lab-results.pdf');
const pdfBase64 = pdfBuffer.toString('base64');

// Extract data
const response = await fetch('/api/ai/pdf/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pdfBase64 })
});

const data = await response.json();
console.log(data.data.tests);
// [
//   {
//     testName: "Creatinine",
//     value: "1.15",
//     unit: "mg/dL",
//     confidence: 0.95
//   },
//   ...
// ]
```

### Medication Analysis

Analyze medication impact:

```javascript
const response = await fetch('/api/ai/medication/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    medicationName: "Lisinopril",
    labTestId: "creatinine"
  })
});

const data = await response.json();
console.log(data.analysis);
// "Lisinopril may cause a small increase in creatinine..."
```

## API Endpoints

### Chat

- `POST /api/ai/chat` - Send a message
- `POST /api/ai/chat/stream` - Stream responses (SSE)
- `GET /api/ai/chat/:conversationId` - Get conversation history
- `DELETE /api/ai/chat/:conversationId` - Clear conversation
- `GET /api/ai/suggestions` - Get suggested questions

### Analytics AI

- `POST /api/ai/summary` - Generate health summary
- `POST /api/ai/prediction/explain` - Explain predictions
- `POST /api/ai/anomaly/explain` - Explain anomalies
- `POST /api/ai/medication/analyze` - Analyze medications
- `POST /api/ai/query` - Natural language query
- `POST /api/ai/pdf/extract` - Extract from PDF
- `GET /api/ai/features` - List all AI features
- `GET /api/ai/costs` - Get cost statistics

## Privacy & Safety

### What We Do to Protect Your Data

✅ **De-identification**: All data sent to AI is de-identified
- Names, dates, phone numbers, addresses removed
- Only lab values and patterns sent to AI

✅ **No Training**: Your data is NOT used to train AI models
- OpenAI: API data not used for training
- Anthropic: Data deleted after 30 days

✅ **Encryption**: All data encrypted in transit and at rest
- HTTPS/TLS 1.3 for all communications
- AES-256 encryption for stored data

✅ **Consent**: You must opt-in to use AI features
- Clear consent dialog before first use
- Can disable AI features anytime

✅ **Audit Logging**: All AI interactions logged
- Track what data was sent
- Monitor for security issues
- Logs purged after 90 days

### Medical Disclaimer

⚠️ **Important**: AI features are for educational purposes only

- **NOT medical advice**
- **NOT a diagnosis**
- **NOT a treatment recommendation**

Always consult your healthcare provider for medical advice.

### What AI Can Do

✅ Explain medical terms in simple language
✅ Describe trends and patterns
✅ Provide health summaries
✅ Extract lab values from documents
✅ Suggest questions to ask your doctor

### What AI Cannot Do

❌ Diagnose medical conditions
❌ Recommend treatments
❌ Prescribe medications
❌ Replace medical advice
❌ Make definitive health claims

## Cost Management

### Estimated Costs Per Request

| Feature | Model | Cost |
|---------|-------|------|
| Chat (simple query) | GPT-3.5 | ~$0.002 |
| Chat (complex query) | GPT-4 Turbo | ~$0.03 |
| Health Summary | GPT-4 Turbo | ~$0.15 |
| PDF Extraction | GPT-4 Turbo | ~$0.08 |
| Medication Analysis | GPT-4 Turbo | ~$0.05 |

### Cost-Saving Tips

1. **Use GPT-3.5** for simple queries (10x cheaper)
2. **Enable caching** - repeat queries are free
3. **Set budgets** - limit daily/monthly spending
4. **Monitor costs** - check `/api/ai/costs` regularly

### Set Budget Alerts

```javascript
// In production, add budget monitoring
if (totalCost > BUDGET_THRESHOLD) {
  alert('AI cost budget exceeded');
}
```

## Troubleshooting

### "Invalid API Key" Error

**Problem**: API key not configured correctly

**Solution**:
```bash
# Check .env file
cat .env | grep API_KEY

# Should see:
# OPENAI_API_KEY=sk-...
```

### "Rate Limit Exceeded" Error

**Problem**: Too many API requests

**Solution**:
- Implement rate limiting
- Add exponential backoff
- Upgrade API tier if needed

### "Failed to Understand Query"

**Problem**: Ambiguous question

**Solution**:
- Be more specific
- Use medical terminology correctly
- Try rephrasing the question

### Slow Responses

**Problem**: High latency from LLM API

**Solution**:
- Use streaming responses (`/api/ai/chat/stream`)
- Switch to faster model (GPT-3.5)
- Enable caching

## Documentation

- **[AI Features](./AI_FEATURES.md)** - Complete AI documentation
- **[Privacy & Compliance](./PRIVACY.md)** - Privacy and GDPR/HIPAA compliance
- **[API Reference](./API_DOCUMENTATION.md)** - Full API documentation
- **[Quick Start](./QUICK_START.md)** - Get started in 5 minutes

## Examples

### Example 1: Chat with Streaming

```javascript
const response = await fetch('/api/ai/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Explain my eGFR trend"
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  console.log(chunk);
  // Streams response in real-time
}
```

### Example 2: Export Conversation

```javascript
// Export as text
const response = await fetch('/api/ai/chat/export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: 'conv_123456',
    format: 'text'
  })
});

const text = await response.text();
console.log(text);
// Analisi Tracker Chat Export
// Conversation ID: conv_123456
// ...
```

### Example 3: Natural Language Query

```javascript
const response = await fetch('/api/ai/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "What's my average hemoglobin?"
  })
});

const data = await response.json();
console.log(data);
// {
//   response: "Your average hemoglobin is 14.2 g/dL...",
//   intent: { intent: "statistics", labTest: "hemoglobin" },
//   data: { mean: 14.2, min: 13.5, max: 14.8 }
// }
```

## Support

### Questions?

- **Documentation**: Check [AI_FEATURES.md](./AI_FEATURES.md)
- **Issues**: https://github.com/yourusername/analisi-tracker/issues
- **Discussions**: https://github.com/yourusername/analisi-tracker/discussions

### Getting Help

1. Check the documentation first
2. Search existing issues
3. Create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details

## Feedback

We welcome feedback on the AI features!

**What to Share:**
- Response quality
- Incorrect information
- Confusing explanations
- Feature requests
- Cost concerns

**How to Share:**
- GitHub issues (preferred)
- Feedback form (if available)
- Email support

## Roadmap

### Planned Features

- [ ] Voice input for chat
- [ ] Multi-language support
- [ ] Custom reference ranges
- [ ] Population benchmarking
- [ ] Drug-drug interactions
- [ ] Allergy detection
- [ ] Doctor reports
- [ ] Mobile app

### Research

- [ ] Fine-tuned medical models
- [ ] Few-shot learning
- [ ] Causal inference
- [ ] Ensemble predictions

---

**Version**: 2.0.0
**Last Updated**: April 2026

**Remember**: This is an educational tool. Always consult healthcare professionals for medical advice.

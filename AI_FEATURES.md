# AI Features Documentation

## Overview

Analisi Tracker v2.0 includes advanced AI-powered features that provide natural language interaction, intelligent document processing, and automated health insights. These features leverage Large Language Models (LLMs) and Retrieval-Augmented Generation (RAG) to deliver accurate, context-aware responses while maintaining patient privacy and safety.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [API Reference](#api-reference)
5. [Privacy & Security](#privacy--security)
6. [Cost Management](#cost-management)
7. [Compliance](#compliance)
8. [Troubleshooting](#troubleshooting)

## Features

### 1. Natural Language Chat Interface

**Endpoint:** `POST /api/ai/chat`

ChatGPT-style interface for asking questions about your health data in plain English.

**Capabilities:**
- Ask questions about lab results, trends, and patterns
- Get explanations of medical terms in simple language
- Multi-turn conversations with context awareness
- Real-time streaming responses
- Conversation history and export

**Example Queries:**
- "Show me my creatinine trends over the last 6 months"
- "What's my average glucose level?"
- "Compare my cholesterol to last year"
- "Which values are out of range?"
- "Explain what eGFR measures"
- "How are my creatinine and eGFR related?"

**Safety Features:**
- Medical disclaimer on all responses
- Prohibited topics: diagnosis, treatment recommendations
- Confidence scores shown to users
- Sources cited for verification
- Guardrails for medical questions

### 2. Health Summary Generation

**Endpoint:** `POST /api/ai/summary`

Generate comprehensive, patient-friendly summaries of laboratory test results.

**What's Included:**
- Overall health status overview
- Key findings from recent tests
- Trend descriptions (improving, worsening, stable)
- Explanation of abnormal values
- Correlations between tests
- Questions to ask your healthcare provider
- Positive notes and improvements

**Features:**
- Plain language explanations
- Non-alarmist tone
- Contextual information
- Actionable insights
- Always includes medical disclaimer

### 3. AI-Powered PDF Extraction

**Endpoint:** `POST /api/ai/pdf/extract`

Extract laboratory test values from PDF documents using advanced OCR and LLM understanding.

**Capabilities:**
- Automatic lab value detection
- Unit standardization
- Reference range extraction
- Abnormal flag detection
- Confidence scoring
- Multiple PDF format support

**Pipeline:**
1. **Text Extraction:** Direct text extraction or OCR fallback
2. **Layout Detection:** Identify tables, headers, sections
3. **LLM Extraction:** Use GPT-4/Claude to extract structured data
4. **Validation:** Confidence scoring and validation checks
5. **Post-Processing:** Standardize names, units, reference ranges

**Confidence Scoring:**
- 0.9-1.0: High confidence (auto-accept)
- 0.7-0.9: Medium confidence (review recommended)
- <0.7: Low confidence (manual review required)

**Learning from Corrections:**
- System learns from user corrections
- Improves over time
- Correction database for fine-tuning

### 4. Prediction Explanations

**Endpoint:** `POST /api/ai/prediction/explain`

Get plain-language explanations of predictive analytics.

**What's Explained:**
- What the prediction means
- How predictions work
- Confidence level
- Practical interpretation
- Limitations and uncertainties
- Actionable insights

**Example:**
"Based on your last 8 creatinine measurements, our model predicts that in 30 days, your creatinine level will likely be between 1.1 and 1.3 mg/dL, with a best estimate of 1.2 mg/dL.

The model is moderately confident (75%) based on the strong historical pattern. However, kidney function naturally fluctuates due to hydration, diet, and exercise."

### 5. Anomaly Explanations

**Endpoint:** `POST /api/ai/anomaly/explain`

Understand what anomalous lab values mean for your health.

**What's Explained:**
- Why the value is unusual
- Possible causes
- Context within overall health picture
- Severity assessment (extreme, high, moderate, low)
- Next steps and recommendations

**Severity Levels:**
- **Extreme:** Very unusual values - recommend prompt attention
- **High:** Significantly outside normal range - discuss with provider
- **Moderate:** Outside range but not alarming - mention at next visit
- **Low:** Minor deviation - likely not concerning but note for monitoring

**Important Context:**
- Single anomalous reading may be lab error or temporary fluctuation
- Trends are more important than single values
- Reference ranges are statistical, not absolute
- "Normal" varies by individual

### 6. Medication Impact Analysis

**Endpoint:** `POST /api/ai/medication/analyze`

Analyze potential relationships between medications and laboratory test changes.

**What's Analyzed:**
- Temporal relationships (did changes occur after medication start?)
- Dose-response patterns
- Known associations (with medical literature citations)
- Strength of association (weak/moderate/strong)
- Alternative explanations
- Recommendations for discussion with healthcare provider

**Safety Warnings:**
- Identifies PATTERNS, NOT causation
- Correlation does NOT imply causation
- Many factors can affect lab results
- NEVER recommends stopping or changing medications
- ALWAYS recommends consulting prescribing physician

**Sources Cited:**
- NIH MedlinePlus drug information
- FDA drug labels
- Clinical pharmacology textbooks
- Peer-reviewed medical literature

### 7. Natural Language Query

**Endpoint:** `POST /api/ai/query`

Query your analytics data using natural language.

**Supported Query Types:**
- **Trend Queries:** "Show me trends over time"
- **Statistics:** "What's my average value?"
- **Comparisons:** "Compare to last year"
- **Abnormalities:** "Which values are out of range?"
- **Correlations:** "How are two tests related?"
- **Predictions:** "What will my value be in X days?"

**How It Works:**
1. Intent detection (what type of query)
2. Entity extraction (which tests, time ranges)
3. API execution (run actual analytics)
4. Response generation (natural language answer)

## Architecture

### System Components

```
User Query → Intent Detection → RAG Pipeline → LLM → Response
PDF Upload → OCR → Layout Analysis → LLM → Structured Data → Validation
```

### Services

1. **LLM Service** (`server/ai/llm-service.js`)
   - OpenAI and Anthropic API integration
   - Streaming responses
   - Cost tracking
   - Data de-identification
   - Medical response validation

2. **RAG Service** (`server/ai/rag-service.js`)
   - Knowledge base management
   - Vector similarity search
   - Context retrieval
   - Response generation

3. **PDF Extractor** (`server/ai/pdf-extractor.js`)
   - OCR processing
   - Layout detection
   - LLM-based extraction
   - Validation and confidence scoring
   - Batch processing

4. **Prompts** (`server/ai/prompts.js`)
   - System prompts for each AI feature
   - Safety guidelines
   - Medical domain knowledge
   - Few-shot examples

### Data Flow

**Chat Flow:**
```
User Message
    ↓
De-identify (remove PHI)
    ↓
Load Patient Context (lab results, trends, medications)
    ↓
RAG Retrieval (find relevant medical knowledge)
    ↓
Build Messages (system prompt + context + user query)
    ↓
LLM Streaming Response
    ↓
Validate Medical Safety
    ↓
Return to User (with sources and disclaimer)
```

**PDF Extraction Flow:**
```
PDF Upload
    ↓
Text Extraction (direct or OCR)
    ↓
Layout Detection (tables, sections)
    ↓
LLM Extraction (GPT-4/Claude)
    ↓
Validation (confidence scoring)
    ↓
Post-Processing (standardize names, units)
    ↓
Return Structured Data (with confidence scores)
```

## Setup & Configuration

### 1. Environment Variables

Create a `.env` file in the project root:

```bash
# AI/LLM Configuration
LLM_PROVIDER=openai  # Options: openai, anthropic
LLM_MODEL=gpt-4-turbo-preview
LLM_MAX_TOKENS=4000
LLM_TEMPERATURE=0.7

# OpenAI API Key (if using OpenAI)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Anthropic API Key (if using Anthropic)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# AI Feature Flags
ENABLE_AI_CHAT=true
ENABLE_AI_SUMMARIES=true
ENABLE_AI_PDF_EXTRACTION=true
ENABLE_AI_MEDICATION_ANALYSIS=true

# Privacy & Compliance
ENABLE_DATA_DEIDENTIFICATION=true
REQUIRE_CONSENT_FOR_AI=true
LOG_AI_INTERACTIONS=true
AI_LOG_RETENTION_DAYS=90
```

### 2. API Key Setup

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Add to `.env`: `OPENAI_API_KEY=sk-...`
4. Recommended model: `gpt-4-turbo-preview` (best quality/cost ratio)

**Anthropic:**
1. Go to https://console.anthropic.com/
2. Create new API key
3. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`
4. Recommended model: `claude-3-sonnet` (good for medical contexts)

### 3. Install Dependencies

```bash
npm install
```

No additional dependencies needed - uses existing packages.

### 4. Start Server

```bash
npm start
```

Server will start on port 3000 (or configured PORT).

### 5. Verify Installation

```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-04-06T...",
  "uptime": ...,
  "version": "2.0.0"
}
```

## API Reference

### Chat Endpoints

#### POST /api/ai/chat

Send a message and get AI response.

**Request:**
```json
{
  "message": "Show me my creatinine trends",
  "conversationId": "conv_123456",  // optional
  "patientId": "sample",  // optional
  "includeContext": true  // optional, default true
}
```

**Response:**
```json
{
  "conversationId": "conv_123456",
  "response": "Based on your last 8 creatinine measurements...",
  "sources": [
    { "id": "lab-tests-creatinine", "similarity": 0.85 }
  ],
  "usage": {
    "inputTokens": 450,
    "outputTokens": 280
  },
  "needsDisclaimer": true
}
```

#### POST /api/ai/chat/stream

Streaming chat responses (Server-Sent Events).

**Request:** Same as `/api/ai/chat`

**Response:** SSE stream
```
data: {"type":"content","content":"Based"}
data: {"type":"content","content":" on"}
data: {"type":"content","content":" your"}
data: {"type":"done","conversationId":"conv_123456","usage":{...}}
```

#### GET /api/ai/chat/:conversationId

Get conversation history.

#### DELETE /api/ai/chat/:conversationId

Clear conversation history.

#### POST /api/ai/chat/export

Export conversation as text or JSON.

**Request:**
```json
{
  "conversationId": "conv_123456",
  "format": "text"  // or "json"
}
```

### Analytics AI Endpoints

#### POST /api/ai/summary

Generate health summary.

**Request:**
```json
{
  "patientId": "sample",
  "includeTrends": true,
  "includeAnomalies": true,
  "includePredictions": false
}
```

**Response:**
```json
{
  "summary": "# Health Summary\n\n## Overall Status\n...",
  "safe": true,
  "usage": {...},
  "generatedAt": "2026-04-06T..."
}
```

#### POST /api/ai/prediction/explain

Explain predictions in natural language.

**Request:**
```json
{
  "labTestId": "creatinine",
  "forecastHorizon": 30
}
```

#### POST /api/ai/anomaly/explain

Explain anomalies in natural language.

**Request:**
```json
{
  "labTestId": "alt"
}
```

#### POST /api/ai/medication/analyze

Analyze medication impact on lab values.

**Request:**
```json
{
  "medicationName": "Lisinopril",
  "labTestId": "creatinine"  // optional
}
```

#### POST /api/ai/query

Natural language query to analytics data.

**Request:**
```json
{
  "query": "What's my average glucose?",
  "patientId": "sample"
}
```

**Response:**
```json
{
  "response": "Your average glucose level is 105 mg/dL...",
  "intent": {
    "intent": "statistics",
    "labTest": "glucose",
    "parameters": { "statistic": "mean" }
  },
  "data": {
    "test": "glucose",
    "count": 15,
    "mean": 105.2,
    "min": 87,
    "max": 142,
    "latest": 98
  }
}
```

#### POST /api/ai/pdf/extract

Extract lab values from PDF.

**Request:**
```json
{
  "pdfBase64": "JVBERi0xLjQKJ...",  // base64-encoded PDF
  "options": {
    "useOCR": true,
    "validate": true,
    "includeMetadata": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tests": [
      {
        "testName": "Creatinine",
        "value": "1.15",
        "unit": "mg/dL",
        "numericValue": 1.15,
        "referenceRange": {
          "lower": 0.7,
          "upper": 1.3,
          "text": "0.7-1.3 mg/dL"
        },
        "isAbnormal": false,
        "confidence": 0.95,
        "needsReview": false
      }
    ],
    "metadata": {
      "testDate": "2026-04-01",
      "facility": "LabCorp",
      "overallConfidence": 0.92
    },
    "summary": {
      "totalTests": 15,
      "abnormalTests": 2,
      "lowConfidenceTests": 0
    }
  }
}
```

#### GET /api/ai/features

List available AI features.

#### GET /api/ai/suggestions

Get suggested questions to ask.

#### GET /api/ai/costs

Get LLM cost statistics.

## Privacy & Security

### Data De-identification

All data sent to LLMs is automatically de-identified:

**Removed:**
- Dates (replaced with `[DATE]`)
- Phone numbers (replaced with `[PHONE]`)
- Email addresses (replaced with `[EMAIL]`)
- SSN patterns (replaced with `[SSN]`)
- Addresses (replaced with `[ADDRESS]`)

**Example:**
```
Original: "John Smith, DOB 01/15/1980, had creatinine 1.2 mg/dL on 03/15/2026"
De-identified: "Patient, DOB [DATE], had creatinine 1.2 mg/dL on [DATE]"
```

### Consent Management

**Feature Flags:**
- `REQUIRE_CONSENT_FOR_AI=true` - Require user consent before using AI features
- `ENABLE_DATA_DEIDENTIFICATION=true` - Force de-identification of all data

**Best Practices:**
- Display consent banner before first AI use
- Allow users to opt-out of AI features
- Provide clear explanation of data usage
- Log all AI interactions for audit

### Audit Logging

**What's Logged:**
- Timestamp
- User ID (de-identified)
- Query/request type
- Response metadata (not content)
- Token usage
- Cost

**Retention:**
- `AI_LOG_RETENTION_DAYS=90` (configurable)
- Logs automatically purged after retention period

**Access:**
- Logs stored in `/server/logs/ai-interactions.log`
- JSON format for easy parsing
- Searchable by user ID, date range, feature type

## Cost Management

### Pricing Models

**OpenAI:**
- `gpt-4-turbo-preview`: $10 input / $30 output per 1M tokens
- `gpt-4`: $30 input / $60 output per 1M tokens
- `gpt-3.5-turbo`: $0.50 input / $1.50 output per 1M tokens

**Anthropic:**
- `claude-3-opus`: $15 input / $75 output per 1M tokens
- `claude-3-sonnet`: $3 input / $15 output per 1M tokens

### Cost Tracking

**Real-Time Tracking:**
```bash
GET /api/ai/costs
```

**Response:**
```json
{
  "totalCost": "12.45",
  "totalTokens": 245000,
  "provider": "openai",
  "model": "gpt-4-turbo-preview"
}
```

**Console Logging:**
Every LLM call logs cost to console:
```
LLM Call - Model: gpt-4-turbo-preview, Input: 450, Output: 280, Cost: $0.0125
```

### Cost Optimization Strategies

1. **Model Selection:**
   - Use `gpt-3.5-turbo` for simple queries
   - Use `gpt-4-turbo-preview` for complex medical explanations
   - Use `claude-3-sonnet` for cost-effective medical queries

2. **Caching:**
   - Cache common responses (e.g., medical term definitions)
   - Use conversation context to avoid repeating information
   - Cache RAG retrieval results

3. **Token Management:**
   - Limit context window (`LLM_MAX_TOKENS`)
   - Truncate long documents before sending to LLM
   - Use more concise prompts

4. **User Quotas:**
   - Implement per-user token limits
   - Rate limiting on AI endpoints
   - Daily/weekly/monthly caps

**Example Cost Per Request:**
- Simple query (gpt-3.5): ~$0.002
- Health summary (gpt-4-turbo): ~$0.15
- PDF extraction (gpt-4-turbo): ~$0.08
- Chat conversation (gpt-4-turbo, 10 turns): ~$0.30

### Budget Alerts

Set up cost monitoring and alerts:

```javascript
// In production, add to llm-service.js
if (this.totalCost > BUDGET_THRESHOLD) {
  sendAlert(`LLM cost exceeded $${this.totalCost}`);
}
```

## Compliance

### GDPR Compliance

**Requirements Met:**
- ✅ Data de-identification before processing
- ✅ User consent management
- ✅ Right to explanation (AI responses include sources)
- ✅ Data minimization (only send relevant data)
- ✅ Audit logging
- ✅ Data retention policies

**Implementation:**
- Consent management system
- Data deletion on request
- Export user data (GDPR right to portability)
- Clear privacy policy

### HIPAA Compliance (If Applicable)

**Requirements:**
- ✅ PHI de-identification (Safe Harbor method)
- ✅ Business Associate Agreement (BAA) with AI providers
- ✅ Access controls and authentication
- ✅ Audit logging
- ✅ Encryption in transit (HTTPS) and at rest

**Note:**
- OpenAI offers BAA for enterprise accounts
- Anthropic offers BAA for healthcare customers
- Consult legal counsel before deployment

### Data Residency

**Options:**
- **OpenAI:** Data processed in US/EU based on account region
- **Anthropic:** Data processed in US
- **On-Premise:** Use open-source models (Llama 3, Mistral) for full control

**Recommendation:**
- Use region-specific API endpoints
- Implement data residency controls
- Comply with local regulations (e.g., AI Act in EU)

## Troubleshooting

### Common Issues

#### 1. "LLM service error: 401"

**Problem:** Invalid API key

**Solution:**
- Check `.env` file for correct API key
- Verify API key is active (has credits)
- Regenerate API key if needed

#### 2. "LLM service error: 429"

**Problem:** Rate limit exceeded

**Solution:**
- Implement rate limiting on your end
- Add exponential backoff
- Upgrade API tier if needed

#### 3. "Failed to understand query"

**Problem:** Ambiguous or unsupported query

**Solution:**
- Clarify the query with the user
- Check supported query types in documentation
- Use more specific language

#### 4. "PDF extraction failed"

**Problem:** OCR or LLM extraction error

**Solution:**
- Ensure PDF is not password-protected
- Check PDF quality (resolution, clarity)
- Try manual entry for problematic PDFs

#### 5. Slow responses

**Problem:** High latency from LLM API

**Solution:**
- Use streaming responses for better UX
- Switch to faster model (e.g., gpt-3.5-turbo)
- Implement caching for common queries
- Use RAG to reduce context size

### Debug Mode

Enable debug logging:

```bash
# .env
NODE_ENV=development
LOG_AI_INTERACTIONS=true
```

Check logs:
```bash
tail -f server/logs/ai-interactions.log
```

### Testing

Test AI features without API costs:

```bash
# Test with mock responses
LLM_PROVIDER=mock npm test
```

## Best Practices

### For Developers

1. **Always include disclaimers** on AI-generated medical content
2. **Validate responses** before showing to users
3. **Monitor costs** and implement budgets
4. **Log interactions** for audit and improvement
5. **Handle errors gracefully** with user-friendly messages
6. **Implement rate limiting** to control costs
7. **Cache responses** to reduce API calls
8. **Use streaming** for better UX on long responses
9. **Test prompts** thoroughly before production
10. **Keep prompts updated** with medical guidelines

### For Users

1. **AI is not a doctor** - always consult healthcare providers
2. **Verify information** with trusted sources
3. **Report issues** to help improve the system
4. **Understand limitations** - AI can make mistakes
5. **Use as a tool** to augment, not replace, medical advice
6. **Provide feedback** on response quality
7. **Review confidence scores** before trusting extractions
8. **Keep context** - AI works best with conversation history

## Future Enhancements

### Planned Features

- [ ] Voice input for chat interface
- [ ] Multi-language support
- [ ] Integration with wearable devices
- [ ] Real-time alert generation
- [ ] Doctor-friendly report generation
- [ ] Population benchmarking (anonymized)
- [ ] Drug-drug interaction checking
- [ ] Allergy detection
- [ ] Custom reference range calculation
- [ ] On-premise LLM support (Llama 3, Mistral)

### Research Directions

- [ ] Fine-tuning models on medical data
- [ ] Few-shot learning with patient examples
- [ ] Multi-modal AI (images + text)
- [ ] Federated learning for privacy
- [ ] Causal inference for medication effects
- [ ] Temporal pattern recognition
- [ ] Ensemble predictions with ML models

## Support & Resources

### Documentation

- **Quick Start:** `/QUICK_START.md`
- **API Reference:** `/API_DOCUMENTATION.md`
- **Analytics:** `/ANALYTICS_IMPLEMENTATION_SUMMARY.md`
- **AI Features:** This file

### Community

- **GitHub:** https://github.com/yourusername/analisi-tracker
- **Issues:** https://github.com/yourusername/analisi-tracker/issues
- **Discussions:** https://github.com/yourusername/analisi-tracker/discussions

### External Resources

- **OpenAI API:** https://platform.openai.com/docs
- **Anthropic API:** https://docs.anthropic.com
- **Medical Knowledge:** NIH MedlinePlus, PubMed

### Legal & Compliance

- **GDPR:** https://gdpr.eu/
- **HIPAA:** https://www.hhs.gov/hipaa/
- **AI Act:** https://artificialintelligenceact.eu/

---

**Version:** 2.0.0
**Last Updated:** April 2026
**License:** MIT

Remember: This is an educational tool. Always consult healthcare professionals for medical advice.

/**
 * LLM Service - Main AI Integration Layer
 * Supports OpenAI (GPT-4) and Anthropic (Claude) APIs
 * Implements streaming, caching, and cost tracking
 */

import dotenv from 'dotenv';

dotenv.config();

class LLMService {
  constructor() {
    this.provider = process.env.LLM_PROVIDER || 'openai'; // 'openai' or 'anthropic'
    this.apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    this.model = process.env.LLM_MODEL || 'gpt-4-turbo-preview';
    this.maxTokens = parseInt(process.env.LLM_MAX_TOKENS) || 4000;
    this.temperature = parseFloat(process.env.LLM_TEMPERATURE) || 0.7;

    // Cost tracking (per 1M tokens)
    this.costs = {
      'gpt-4-turbo-preview': { input: 10, output: 30 },
      'gpt-4': { input: 30, output: 60 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
      'claude-3-opus': { input: 15, output: 75 },
      'claude-3-sonnet': { input: 3, output: 15 }
    };

    this.totalCost = 0;
    this.totalTokens = 0;
  }

  /**
   * Make a streaming LLM call
   */
  async *streamChat(messages, options = {}) {
    const { temperature = this.temperature, maxTokens = this.maxTokens, model = this.model } = options;

    try {
      if (this.provider === 'anthropic') {
        yield* this.streamAnthropic(messages, { temperature, maxTokens, model });
      } else {
        yield* this.streamOpenAI(messages, { temperature, maxTokens, model });
      }
    } catch (error) {
      console.error('LLM streaming error:', error);
      throw new Error(`LLM service error: ${error.message}`);
    }
  }

  /**
   * Stream from OpenAI API
   */
  async *streamOpenAI(messages, { temperature, maxTokens, model }) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          if (trimmed === 'data: [DONE]') continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            const content = data.choices?.[0]?.delta?.content;

            if (content) {
              outputTokens++;
              yield { content, done: false };
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      // Calculate cost (estimate input tokens from messages)
      inputTokens = this.estimateTokens(messages);
      this.trackCost(model, inputTokens, outputTokens);

      yield { content: '', done: true, usage: { inputTokens, outputTokens } };

    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Stream from Anthropic API
   */
  async *streamAnthropic(messages, { temperature, maxTokens, model }) {
    // Convert OpenAI format to Anthropic format
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        system: systemMessage?.content || '',
        messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
        temperature,
        max_tokens: maxTokens,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let outputTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            const content = data.delta?.text;

            if (content) {
              outputTokens++;
              yield { content, done: false };
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      const inputTokens = this.estimateTokens(messages);
      this.trackCost(model, inputTokens, outputTokens);

      yield { content: '', done: true, usage: { inputTokens, outputTokens } };

    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Non-streaming chat completion
   */
  async chat(messages, options = {}) {
    const chunks = [];
    let usage = null;

    for await (const chunk of this.streamChat(messages, options)) {
      if (!chunk.done) {
        chunks.push(chunk.content);
      } else {
        usage = chunk.usage;
      }
    }

    return {
      content: chunks.join(''),
      usage
    };
  }

  /**
   * Estimate token count (rough estimate: ~4 chars per token)
   */
  estimateTokens(messages) {
    const text = messages.map(m => m.content).join(' ');
    return Math.ceil(text.length / 4);
  }

  /**
   * Track API costs
   */
  trackCost(model, inputTokens, outputTokens) {
    const pricing = this.costs[model] || this.costs['gpt-4-turbo-preview'];
    const cost = (inputTokens / 1e6) * pricing.input + (outputTokens / 1e6) * pricing.output;

    this.totalCost += cost;
    this.totalTokens += inputTokens + outputTokens;

    console.log(`LLM Call - Model: ${model}, Input: ${inputTokens}, Output: ${outputTokens}, Cost: $${cost.toFixed(4)}`);
  }

  /**
   * Get cost statistics
   */
  getCostStats() {
    return {
      totalCost: this.totalCost.toFixed(2),
      totalTokens: this.totalTokens,
      provider: this.provider,
      model: this.model
    };
  }

  /**
   * De-identify PHI from text before sending to LLM
   */
  deidentify(text) {
    // Remove common PHI patterns
    let deidentified = text;

    // Remove dates
    deidentified = deidentified.replace(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g, '[DATE]');

    // Remove phone numbers
    deidentified = deidentified.replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE]');

    // Remove email addresses
    deidentified = deidentified.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');

    // Remove SSN pattern
    deidentified = deidentified.replace(/\d{3}-\d{2}-\d{4}/g, '[SSN]');

    // Remove addresses (basic pattern)
    deidentified = deidentified.replace(/\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)/g, '[ADDRESS]');

    return deidentified;
  }

  /**
   * Validate response for medical safety
   */
  validateMedicalResponse(response) {
    const prohibited = [
      'diagnos',
      'treatment recommend',
      'prescribe',
      'you have',
      'definitely',
      'certainly'
    ];

    const lower = response.toLowerCase();
    for (const term of prohibited) {
      if (lower.includes(term)) {
        return {
          safe: false,
          reason: `Response contains prohibited medical term: ${term}`
        };
      }
    }

    return { safe: true };
  }
}

// Export singleton instance
const llmService = new LLMService();
export default llmService;

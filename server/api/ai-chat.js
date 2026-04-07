/**
 * AI Chat API Endpoints
 * Natural language interface for health data queries
 */

import express from 'express';
import llmService from '../ai/llm-service.js';
import ragService from '../ai/rag-service.js';
import { PROMPTS } from '../ai/prompts.js';
import { loadSampleData } from '../utils/data-loader.js';

const router = express.Router();

// Initialize RAG service
await ragService.initialize();

// Store conversation histories (in production, use Redis or database)
const conversations = new Map();

/**
 * POST /api/ai/chat
 * Send a message and get AI response
 */
router.post('/chat', async (req, res) => {
  try {
    const {
      message,
      conversationId = null,
      patientId = null,
      includeContext = true
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      });
    }

    // Get or create conversation
    const convId = conversationId || generateConversationId();
    let conversation = conversations.get(convId);

    if (!conversation) {
      conversation = {
        id: convId,
        messages: [],
        createdAt: new Date().toISOString(),
        patientId
      };
      conversations.set(convId, conversation);
    }

    // Add user message to history
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Load patient data if context is requested
    let context = {};
    if (includeContext && patientId) {
      context = await loadPatientContext(patientId);
    }

    // Generate AI response
    const response = await generateChatResponse(conversation.messages, context);

    // Add assistant response to history
    conversation.messages.push({
      role: 'assistant',
      content: response.content,
      timestamp: new Date().toISOString(),
      sources: response.sources
    });

    // Update conversation
    conversations.set(convId, conversation);

    res.json({
      conversationId: convId,
      response: response.content,
      sources: response.sources,
      usage: response.usage,
      needsDisclaimer: true
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to generate chat response',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/chat/stream
 * Streaming chat responses
 */
router.post('/chat/stream', async (req, res) => {
  try {
    const {
      message,
      conversationId = null,
      patientId = null,
      includeContext = true
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get or create conversation
    const convId = conversationId || generateConversationId();
    let conversation = conversations.get(convId);

    if (!conversation) {
      conversation = {
        id: convId,
        messages: [],
        createdAt: new Date().toISOString(),
        patientId
      };
      conversations.set(convId, conversation);
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Load context
    let context = {};
    if (includeContext && patientId) {
      context = await loadPatientContext(patientId);
    }

    // Stream response
    const messages = buildConversationMessages(conversation.messages, context);
    let fullResponse = '';

    for await (const chunk of llmService.streamChat(messages)) {
      if (!chunk.done) {
        fullResponse += chunk.content;
        res.write(`data: ${JSON.stringify({
          type: 'content',
          content: chunk.content
        })}\n\n`);
      } else {
        // Send final message with metadata
        res.write(`data: ${JSON.stringify({
          type: 'done',
          conversationId: convId,
          usage: chunk.usage
        })}\n\n`);
      }
    }

    // Add assistant response to history
    conversation.messages.push({
      role: 'assistant',
      content: fullResponse,
      timestamp: new Date().toISOString()
    });

    conversations.set(convId, conversation);
    res.end();

  } catch (error) {
    console.error('Streaming chat error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message
    })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/ai/chat/:conversationId
 * Get conversation history
 */
router.get('/chat/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = conversations.get(conversationId);

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    res.json({
      conversationId: conversation.id,
      messages: conversation.messages,
      createdAt: conversation.createdAt,
      patientId: conversation.patientId
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      error: 'Failed to retrieve conversation'
    });
  }
});

/**
 * DELETE /api/ai/chat/:conversationId
 * Clear conversation history
 */
router.delete('/chat/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversations.has(conversationId)) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    conversations.delete(conversationId);

    res.json({
      success: true,
      message: 'Conversation cleared'
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      error: 'Failed to clear conversation'
    });
  }
});

/**
 * POST /api/ai/chat/export
 * Export conversation as text/PDF
 */
router.post('/chat/export', async (req, res) => {
  try {
    const { conversationId, format = 'text' } = req.body;

    const conversation = conversations.get(conversationId);

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    if (format === 'text') {
      const text = formatConversationAsText(conversation);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="chat-${conversationId}.txt"`);
      res.send(text);

    } else if (format === 'json') {
      res.json(conversation);

    } else {
      res.status(400).json({
        error: 'Invalid format. Use "text" or "json"'
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Failed to export conversation'
    });
  }
});

/**
 * GET /api/ai/suggestions
 * Get suggested questions
 */
router.get('/suggestions', (req, res) => {
  const suggestions = [
    "Show me my creatinine trends over the last 6 months",
    "What's my average glucose level?",
    "Compare my cholesterol to last year",
    "Which values are out of range?",
    "Explain what eGFR measures",
    "What patterns do you see in my lab results?",
    "How are my creatinine and eGFR related?",
    "What will my glucose be in 30 days?",
    "Why is my ALT elevated?",
    "Generate a health summary"
  ];

  res.json({ suggestions });
});

/**
 * GET /api/ai/costs
 * Get LLM cost statistics
 */
router.get('/costs', (req, res) => {
  const stats = llmService.getCostStats();
  res.json(stats);
});

// Helper functions

/**
 * Generate chat response
 */
async function generateChatResponse(messages, context) {
  // Build messages with system prompt and context
  const fullMessages = buildConversationMessages(messages, context);

  // Use RAG for relevant knowledge
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const ragResponse = await ragService.generateResponse(lastUserMessage.content, context);

  return ragResponse;
}

/**
 * Build conversation messages with system prompt and context
 */
function buildConversationMessages(messages, context) {
  const builtMessages = [
    {
      role: 'system',
      content: PROMPTS.CHAT_SYSTEM
    }
  ];

  // Add context to system message if available
  if (context.labResults) {
    builtMessages[0].content += `\n\nPATIENT DATA:\n${JSON.stringify(context.labResults, null, 2)}`;
  }

  if (context.trends) {
    builtMessages[0].content += `\n\nRECENT TRENDS:\n${JSON.stringify(context.trends, null, 2)}`;
  }

  // Add conversation messages (de-identified)
  for (const msg of messages) {
    const deidentified = llmService.deidentify(msg.content);
    builtMessages.push({
      role: msg.role,
      content: deidentified
    });
  }

  return builtMessages;
}

/**
 * Load patient context for RAG
 */
async function loadPatientContext(patientId) {
  try {
    const data = await loadSampleData();

    // Get recent lab results
    const recentResults = {};
    for (const [testName, testData] of Object.entries(data.labResults)) {
      recentResults[testName] = testData.slice(-5); // Last 5 results
    }

    return {
      labResults: recentResults,
      medications: data.medications?.map(m => m.name) || [],
      events: data.events || []
    };

  } catch (error) {
    console.error('Error loading patient context:', error);
    return {};
  }
}

/**
 * Generate unique conversation ID
 */
function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format conversation as text
 */
function formatConversationAsText(conversation) {
  let text = `Analisi Tracker Chat Export\n`;
  text += `Conversation ID: ${conversation.id}\n`;
  text += `Date: ${new Date(conversation.createdAt).toLocaleString()}\n`;
  text += `Messages: ${conversation.messages.length}\n`;
  text += `\n${'='.repeat(60)}\n\n`;

  for (const msg of conversation.messages) {
    const role = msg.role === 'user' ? 'You' : 'AI Assistant';
    const time = new Date(msg.timestamp).toLocaleTimeString();
    text += `[${time}] ${role}:\n`;
    text += `${msg.content}\n\n`;
  }

  text += `\n${'='.repeat(60)}\n`;
  text += `\nGenerated by Analisi Tracker\n`;
  text += `https://github.com/yourusername/analisi-tracker\n`;

  return text;
}

export default router;

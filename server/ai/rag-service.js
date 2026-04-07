/**
 * RAG (Retrieval-Augmented Generation) Service
 * Provides accurate, context-aware AI responses using vector similarity search
 */

import fs from 'fs/promises';
import path from 'path';
import llmService from './llm-service.js';

class RAGService {
  constructor() {
    this.knowledgeBase = new Map();
    this.vectorDimension = 1536; // OpenAI text-embedding-3-small dimension
    this.chunkSize = 500;
    this.chunkOverlap = 50;
    this.topK = 3; // Number of relevant chunks to retrieve
  }

  /**
   * Initialize knowledge base from documentation files
   */
  async initialize() {
    await this.loadMedicalKnowledge();
    await this.loadProjectDocumentation();
    console.log(`RAG service initialized with ${this.knowledgeBase.size} knowledge chunks`);
  }

  /**
   * Load medical knowledge base
   */
  async loadMedicalKnowledge() {
    const knowledge = [
      {
        id: 'lab-tests-creatinine',
        text: `Creatinine is a waste product produced by muscles from the breakdown of creatine. Normal range: 0.7-1.3 mg/dL for men, 0.6-1.1 mg/dL for women. High creatinine may indicate reduced kidney function. Low creatinine is rarely concerning and may be due to low muscle mass.`,
        metadata: { category: 'lab-test', test: 'creatinine' }
      },
      {
        id: 'lab-tests-egfr',
        text: `eGFR (Estimated Glomerular Filtration Rate) measures how well kidneys filter waste. Normal: 90-120 mL/min/1.73m². Stage 1 CKD: 90+, Stage 2: 60-89, Stage 3: 30-59, Stage 4: 15-29, Stage 5: <15. eGFR decreases with age and is inversely correlated with creatinine.`,
        metadata: { category: 'lab-test', test: 'egfr' }
      },
      {
        id: 'lab-tests-glucose',
        text: `Blood glucose measures sugar levels. Normal fasting: 70-100 mg/dL. Prediabetes: 100-125. Diabetes: 126+. Glucose fluctuates throughout the day. Levels affected by food, exercise, stress, medications. HbA1c measures 3-month average blood sugar.`,
        metadata: { category: 'lab-test', test: 'glucose' }
      },
      {
        id: 'lab-tests-hba1c',
        text: `Hemoglobin A1c (HbA1c) reflects average blood sugar over 2-3 months. Normal: <5.7%. Prediabetes: 5.7-6.4%. Diabetes: 6.5%+. Used to diagnose and monitor diabetes. Goal for diabetics: typically <7.0%. Not affected by short-term fluctuations like fasting glucose.`,
        metadata: { category: 'lab-test', test: 'hba1c' }
      },
      {
        id: 'lab-tests-alt',
        text: `ALT (Alanine Aminotransferase) is a liver enzyme. Normal: 7-56 U/L. Elevated ALT may indicate liver damage from hepatitis, fatty liver, alcohol, medications. Mild elevations (1-2x normal) are common and often transient. Marked elevations (>10x normal) suggest acute liver injury.`,
        metadata: { category: 'lab-test', test: 'alt' }
      },
      {
        id: 'lab-tests-cholesterol',
        text: `Cholesterol is a fat-like substance in blood. Total cholesterol: Normal <200, Borderline 200-239, High 240+. LDL (bad): Optimal <100, Near optimal 100-129, Borderline 130-159, High 160-190, Very high >190. HDL (good): Low risk >60, High risk <40 (men) or <50 (women). Triglycerides: Normal <150, Borderline 150-199, High 200-499, Very high >500.`,
        metadata: { category: 'lab-test', test: 'cholesterol' }
      },
      {
        id: 'trends-improving',
        text: `Improving trends show values moving toward optimal ranges. For creatinine, decreasing is good (better kidney filtration). For eGFR, increasing is good (better kidney function). For glucose, decreasing toward normal range is positive. Trend direction depends on whether high or low values are undesirable.`,
        metadata: { category: 'trends', pattern: 'improving' }
      },
      {
        id: 'trends-worsening',
        text: `Worsening trends show values moving away from optimal ranges. Increasing creatinine suggests declining kidney function. Decreasing eGFR indicates reduced filtration. Rising glucose may indicate worsening diabetes control. Early detection of worsening trends allows for intervention.`,
        metadata: { category: 'trends', pattern: 'worsening' }
      },
      {
        id: 'trends-stable',
        text: `Stable trends show consistent values over time. Stability is generally positive for normal-range values. For abnormal values, stability may indicate chronic condition. Rate-of-change analysis determines if stability is statistically significant or just random variation.`,
        metadata: { category: 'trends', pattern: 'stable' }
      },
      {
        id: 'correlation-strong',
        text: `Strong correlations (|r| > 0.7) indicate robust relationships between variables. Creatinine and eGFR have strong negative correlation (r ≈ -0.95) because they measure opposite aspects of kidney function. Strong correlations don't prove causation but suggest meaningful relationships.`,
        metadata: { category: 'correlation', strength: 'strong' }
      },
      {
        id: 'correlation-moderate',
        text: `Moderate correlations (0.3 < |r| < 0.7) suggest meaningful but not definitive relationships. May be influenced by other factors. Moderate correlations are common in biology due to complex interactions. Worth investigating but not conclusive.`,
        metadata: { category: 'correlation', strength: 'moderate' }
      },
      {
        id: 'anomaly-statistical',
        text: `Statistical anomalies are values significantly different from the pattern. Z-score >3 or < -3 indicates statistical outlier. IQR method flags values below Q1-1.5×IQR or above Q3+1.5×IQR. Not all statistical anomalies are clinically significant. Lab error, temporary illness, or biological variation can cause anomalies.`,
        metadata: { category: 'anomaly', type: 'statistical' }
      },
      {
        id: 'anomaly-clinical',
        text: `Clinical significance depends on context. A single abnormal value may be less concerning than persistent abnormality. Trends matter more than individual points. Patient symptoms, medical history, and medications affect interpretation. Always correlate with clinical picture.`,
        metadata: { category: 'anomaly', type: 'clinical' }
      },
      {
        id: 'prediction-forecasting',
        text: `Predictive models forecast future values based on historical trends. Methods: moving averages (smooths noise), linear regression (detects trends), exponential smoothing (weights recent data), ARIMA (captures patterns), ensemble (combines methods). All models have uncertainty. Predictions become less accurate further into the future.`,
        metadata: { category: 'prediction', type: 'forecasting' }
      },
      {
        id: 'prediction-confidence',
        text: `Prediction confidence indicates certainty. Based on: data quality, trend strength, consistency, prediction horizon. High confidence (strong R², consistent pattern, recent data) = more reliable forecast. Low confidence (weak trend, high variability, long horizon) = less reliable. Use predictions as estimates, not guarantees.`,
        metadata: { category: 'prediction', type: 'confidence' }
      },
      {
        id: 'risk-stratification',
        text: `Risk stratification categorizes patients by likelihood of adverse outcomes. Very High: Values far outside range with worsening trend. High: Outside range with concerning trend. Medium: Borderline with mixed signals. Low: Normal range with stable trend. Risk informs monitoring frequency and intervention urgency.`,
        metadata: { category: 'risk', type: 'stratification' }
      },
      {
        id: 'reference-ranges',
        text: `Reference ranges represent 95% of healthy population (mean ± 2 SD). "Normal" doesn't mean optimal or healthy for everyone. Ranges vary by: age, sex, ethnicity, pregnancy, lab method. Personalized ranges may be more informative than population ranges. Some people have healthy values outside standard ranges.`,
        metadata: { category: 'general', topic: 'reference-ranges' }
      },
      {
        id: 'lab-variation',
        text: `Biological variation is normal. Values fluctuate daily due to: circadian rhythms, food intake, exercise, stress, hydration, sleep, medications. Intra-individual variation (within person) is typically 5-10%. Lab analytical variation is usually <5%. Total variation = biological + analytical. Minor changes within expected variation may not be meaningful.`,
        metadata: { category: 'general', topic: 'variation' }
      },
      {
        id: 'kidney-function',
        text: `Kidney function assessment includes creatinine, eGFR, BUN, and urinalysis. Creatinine and eGFR are inversely related. Normal eGFR declines ~1 mL/min/year after age 40. Chronic Kidney Disease (CKD) stages based on eGFR and albuminuria. Kidney function affected by: blood pressure, diabetes, medications, dehydration.`,
        metadata: { category: 'system', organ: 'kidney' }
      },
      {
        id: 'liver-function',
        text: `Liver function tests include ALT, AST, ALP, GGT, and bilirubin. ALT is liver-specific (elevated in liver injury). AST also elevated in muscle damage. ALT/AST ratio suggests different conditions. ALP elevated in bile duct obstruction. GGT indicates alcohol use or liver stress. Patterns help diagnose specific liver conditions.`,
        metadata: { category: 'system', organ: 'liver' }
      },
      {
        id: 'metabolic-health',
        text: `Metabolic health indicators: glucose, HbA1c, cholesterol, triglycerides. Metabolic syndrome includes: elevated glucose, high triglycerides, low HDL, high blood pressure, abdominal obesity. Insulin resistance underlies metabolic syndrome. Lifestyle changes (diet, exercise, weight loss) are first-line treatment.`,
        metadata: { category: 'system', topic: 'metabolic' }
      },
      {
        id: 'medication-effects',
        text: `Medications can affect lab results. ACE inhibitors (lisinopril) may increase creatinine slightly. Statins can elevate liver enzymes. Diuretics affect electrolytes. Corticosteroids increase glucose. Beta-blockers may slightly raise cholesterol. Always consider medication effects when interpreting lab changes.`,
        metadata: { category: 'medication', topic: 'effects' }
      },
      {
        id: 'statistics-significance',
        text: `Statistical significance (p-value < 0.05) indicates result unlikely due to chance. Does NOT mean clinical importance. Small changes can be statistically significant with many data points. Large changes may not reach significance with few data points. Clinical significance requires interpreting effect size and patient context.`,
        metadata: { category: 'statistics', topic: 'significance' }
      },
      {
        id: 'statistics-confidence-interval',
        text: `95% confidence interval (CI) indicates precision. Narrow CI = precise estimate. Wide CI = uncertain estimate. If CI includes null value (e.g., 0 for difference), not statistically significant. CIs show range of plausible values. Useful for understanding uncertainty in estimates.`,
        metadata: { category: 'statistics', topic: 'confidence-interval' }
      }
    ];

    for (const item of knowledge) {
      const embedding = await this.generateEmbedding(item.text);
      this.knowledgeBase.set(item.id, {
        ...item,
        embedding
      });
    }
  }

  /**
   * Load project documentation
   */
  async loadProjectDocumentation() {
    // In production, load from actual documentation files
    const docs = [
      {
        id: 'project-features',
        text: `Analisi Tracker provides: Trend analysis (improving, worsening, stable patterns), Correlation analysis (relationships between lab tests), Anomaly detection (statistical outliers), Predictive analytics (forecasting future values), Risk stratification (low/medium/high/very high), Comprehensive statistics (mean, median, SD, distribution), Composite health scores (kidney, liver, metabolic), Time-in-range analysis (for diabetes metrics), Early warning alerts, Medication tracking.`,
        metadata: { source: 'project', type: 'features' }
      },
      {
        id: 'project-api',
        text: `API endpoints: GET /api/analytics/trends/:labTestId - Trend analysis, GET /api/analytics/correlations - Correlation matrix, GET /api/analytics/anomalies/:labTestId - Anomaly detection, GET /api/analytics/predictions/:labTestId - Predictions, GET /api/analytics/statistics/:labTestId - Descriptive statistics, GET /api/analytics/insights - Quick insights, GET /api/analytics/comprehensive/:labTestId - Full analysis, POST /api/analytics/cache/clear - Clear cache, GET /api/analytics/cache/stats - Cache statistics.`,
        metadata: { source: 'project', type: 'api' }
      }
    ];

    for (const doc of docs) {
      const embedding = await this.generateEmbedding(doc.text);
      this.knowledgeBase.set(doc.id, {
        ...doc,
        embedding
      });
    }
  }

  /**
   * Generate embedding for text (simulated - in production use OpenAI API)
   * For now, use simple word frequency as a proxy
   */
  async generateEmbedding(text) {
    // Simple TF-IDF style embedding (in production, use OpenAI embeddings API)
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = new Map();

    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }

    // Normalize to create unit vector
    const magnitude = Math.sqrt([...wordFreq.values()].reduce((sum, val) => sum + val * val, 0));
    const normalized = new Map();

    for (const [word, freq] of wordFreq) {
      normalized.set(word, freq / magnitude);
    }

    return normalized;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embedding1, embedding2) {
    // Simple word overlap similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    const allWords = new Set([...embedding1.keys(), ...embedding2.keys()]);

    for (const word of allWords) {
      const v1 = embedding1.get(word) || 0;
      const v2 = embedding2.get(word) || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2) || 1);
  }

  /**
   * Retrieve relevant knowledge chunks
   */
  async retrieve(query, topK = this.topK) {
    const queryEmbedding = await this.generateEmbedding(query);
    const results = [];

    for (const [id, chunk] of this.knowledgeBase) {
      const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      results.push({
        id,
        text: chunk.text,
        metadata: chunk.metadata,
        similarity
      });
    }

    // Sort by similarity and return top K
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  /**
   * Generate RAG response
   */
  async generateResponse(query, context = {}) {
    // Retrieve relevant knowledge
    const relevantChunks = await this.retrieve(query);

    // Build context from retrieved chunks
    const knowledgeContext = relevantChunks
      .map(chunk => chunk.text)
      .join('\n\n');

    // Build user context from analytics data
    const userContext = this.buildUserContext(context);

    // Create messages
    const messages = [
      {
        role: 'system',
        content: `You are a helpful medical analytics assistant with access to relevant medical knowledge.

RELEVANT KNOWLEDGE:
${knowledgeContext}

USER CONTEXT:
${userContext}

Use this knowledge to provide accurate, helpful responses. Always cite sources when providing specific medical information. If the knowledge doesn't contain the answer, say so and recommend consulting a healthcare provider.`
      },
      {
        role: 'user',
        content: query
      }
    ];

    // Generate response using LLM
    const response = await llmService.chat(messages);

    return {
      response: response.content,
      sources: relevantChunks.map(c => ({ id: c.id, similarity: c.similarity })),
      usage: response.usage
    };
  }

  /**
   * Build user context from analytics data
   */
  buildUserContext(context) {
    const parts = [];

    if (context.labResults) {
      parts.push(`Recent lab results: ${JSON.stringify(context.labResults, null, 2)}`);
    }

    if (context.trends) {
      parts.push(`Trends: ${JSON.stringify(context.trends, null, 2)}`);
    }

    if (context.anomalies) {
      parts.push(`Anomalies detected: ${JSON.stringify(context.anomalies, null, 2)}`);
    }

    if (context.medications) {
      parts.push(`Current medications: ${context.medications.join(', ')}`);
    }

    return parts.join('\n\n') || 'No specific user data provided.';
  }
}

// Export singleton instance
const ragService = new RAGService();
export default ragService;

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { insightsService } from './insights.service';
import { logger } from '../config/logger';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface AssistantResponse {
  reply: string;
  lang: 'hi' | 'en';
  action?: { type: 'navigate'; page: string };
}

const SYSTEM_PROMPT = `You are "DukaanSathi" — a friendly, smart voice assistant for Indian small store owners (kirana, grocery, medical, general stores).

CRITICAL LANGUAGE RULE:
- If user speaks in Hindi (Devanagari script or Romanized Hindi like "mera fayda kitna hai"), reply ENTIRELY in Hindi (Devanagari).
- If user speaks in English, reply ENTIRELY in English.
- NEVER mix languages in your reply. Match the user's language exactly.

PERSONALITY:
- Talk like a helpful friend/advisor, not a robot. Be warm but concise.
- Keep replies SHORT and spoken-friendly (this will be read aloud via TTS). 2-4 sentences max for simple queries. 5-8 sentences for detailed analysis.
- Use ₹ for currency, Indian number format (lakhs/crores).
- NEVER use markdown, bullets, numbered lists, bold, or any formatting. Just plain conversational sentences. This text will be spoken aloud by a TTS engine.
- Address the store owner respectfully. You know their business data.
- IMPORTANT: Do NOT start every reply with a greeting like "नमस्ते" or "Hello". Only greet when the user greets you first. For follow-up messages, directly answer the question without any greeting.

CAPABILITIES:
1. NAVIGATION: If user wants to go to a page, include this exact JSON at the END of your reply (after your spoken text):
   <<<NAV:{"page":"/sales"}>>>
   Valid pages: /dashboard, /inventory, /sales, /forecasts, /restock, /reports, /notifications, /stores, /team, /settings

2. BUSINESS INSIGHTS: Use the store data provided to answer questions about profit, sales, stock, trends, etc. Give specific numbers. Give actionable advice.

3. GENERAL CHAT: Greetings, thanks, small talk — be warm and friendly, then gently guide them to ask about their store.

STORE DATA will be provided as context. Use it to give accurate, data-driven answers.`;

const PAGE_MAP: Record<string, string[]> = {
  '/dashboard': ['dashboard', 'home', 'overview', 'होम', 'दुकान', 'मुख्य', 'डैशबोर्ड'],
  '/inventory': ['inventory', 'product', 'stock list', 'सामान', 'प्रोडक्ट', 'इन्वेंटरी', 'स्टॉक'],
  '/sales': ['sale', 'bikri', 'बिक्री', 'सेल', 'बिक'],
  '/forecasts': ['forecast', 'prediction', 'अनुमान', 'भविष्य', 'डिमांड', 'फोरकास्ट'],
  '/restock': ['restock', 'reorder', 'मंगा', 'ऑर्डर', 'रीस्टॉक', 'मंगवा'],
  '/reports': ['report', 'रिपोर्ट'],
  '/notifications': ['notification', 'message', 'alert', 'संदेश', 'नोटिफिकेशन', 'अलर्ट'],
  '/stores': ['my store', 'दुकानें'],
  '/team': ['team', 'staff', 'कर्मचारी', 'टीम', 'स्टाफ'],
  '/settings': ['setting', 'सेटिंग'],
};

// Keywords that indicate user is asking a business question (Hindi + English + Romanized Hindi)
const INSIGHT_KEYWORDS = [
  // English
  'profit', 'profitable', 'loss', 'earning', 'revenue', 'margin', 'growth',
  'improve', 'suggestion', 'advice', 'business', 'doing', 'performance',
  'top sell', 'best sell', 'dead stock', 'slow', 'trend',
  // Romanized Hindi
  'fayda', 'nuksan', 'munafa', 'kamaaee', 'kamai', 'kaisa', 'kaise',
  'sudhar', 'sujhav', 'salah', 'karobar',
  // Devanagari Hindi
  'फायदा', 'फ़ायदा', 'नुकसान', 'मुनाफ', 'प्रॉफिट', 'लॉस', 'कमाई', 'घाटा',
  'मार्जिन', 'ग्रोथ', 'रेवेन्यू', 'सुधार', 'सुझाव', 'सलाह', 'कारोबार',
  'बिज़नेस', 'बिजनेस', 'कैसा', 'कैसी', 'कैसे', 'हाल', 'हालत', 'स्थिति',
  'प्रॉफिटेबल', 'बेकार', 'धीमा', 'ट्रेंड', 'बिक्री', 'बिक',
  'ज़्यादा', 'ज्यादा', 'टॉप', 'बेस्ट', 'सबसे',
];

// Greeting patterns
const GREETING_PATTERNS = [
  /^(hi|hello|hey|good morning|good evening)\b/i,
  /^(नमस्ते|नमस्कार|हेलो|हाय|राम राम)/,
  /^(namaste|namaskar)\b/i,
];

export const assistantService = {
  async chat(
    storeId: string,
    message: string,
    history: ChatMessage[]
  ): Promise<AssistantResponse> {
    const lang = detectLang(message);

    // Try Gemini first
    if (config.gemini.apiKey) {
      try {
        return await geminiChat(storeId, message, history, lang);
      } catch (error: any) {
        logger.error(
          { err: error?.message || error, status: error?.status, statusText: error?.statusText },
          'Gemini API failed — falling back to local'
        );
      }
    } else {
      logger.warn('GEMINI_API_KEY not set — using local fallback');
    }

    // Fallback
    return localChat(storeId, message, lang);
  },
};

async function geminiChat(
  storeId: string,
  message: string,
  history: ChatMessage[],
  lang: 'hi' | 'en'
): Promise<AssistantResponse> {
  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

  // Fetch store data
  let storeContext = 'Store data unavailable.';
  try {
    const insights = await insightsService.getBusinessInsights(storeId);
    storeContext = buildStoreContext(insights);
  } catch (e: any) {
    logger.warn({ err: e?.message }, 'Could not fetch insights for assistant');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: `${SYSTEM_PROMPT}\n\nSTORE DATA:\n${storeContext}\n\nRespond to users now. Match their language.` }],
      },
      {
        role: 'model',
        parts: [{ text: 'Understood. I will match the user\'s language, use store data for answers, and skip greetings unless the user greets me first. I will answer directly.' }],
      },
      // Add recent history
      ...history.slice(-6).map((msg) => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }],
      })),
    ],
  });

  const result = await chat.sendMessage(message);
  let reply = result.response.text().trim();

  // Extract navigation action if present
  let action: AssistantResponse['action'];
  const navMatch = reply.match(/<<<NAV:\{[^}]+\}>>>/);
  if (navMatch) {
    try {
      const navJson = navMatch[0].replace('<<<NAV:', '').replace('>>>', '');
      const nav = JSON.parse(navJson);
      if (nav.page && PAGE_MAP[nav.page]) {
        action = { type: 'navigate', page: nav.page };
      }
    } catch { /* ignore */ }
    reply = reply.replace(/<<<NAV:\{[^}]+\}>>>/, '').trim();
  }

  // Clean markdown — this gets read aloud via TTS so must be plain text
  reply = reply
    .replace(/\*\*/g, '')           // bold
    .replace(/\*/g, '')             // italic
    .replace(/^#+\s/gm, '')        // headings
    .replace(/^[-•]\s/gm, '')      // unordered lists
    .replace(/^\d+\.\s+/gm, '')   // numbered lists
    .replace(/`/g, '')              // code ticks
    .replace(/\n{3,}/g, '\n\n')    // excess newlines
    .trim();

  return { reply, lang, action };
}

async function localChat(
  storeId: string,
  message: string,
  lang: 'hi' | 'en'
): Promise<AssistantResponse> {
  const text = message.toLowerCase();
  const originalText = message;

  // 1. Check greetings
  for (const p of GREETING_PATTERNS) {
    if (p.test(originalText)) {
      const reply = lang === 'hi'
        ? 'नमस्ते जी! मैं दुकानसाथी हूं, आपकी दुकान की सहायक। बताइए क्या जानना है? आप पूछ सकते हैं "कितना फायदा हुआ?", "बिक्री दिखाओ", या "क्या मंगाना है?"'
        : 'Hello! I\'m DukaanSathi, your store assistant. What would you like to know? You can ask "Am I profitable?", "Show sales", or "What to restock?"';
      return { reply, lang };
    }
  }

  // 2. Check navigation
  for (const [page, keywords] of Object.entries(PAGE_MAP)) {
    if (keywords.some((k) => text.includes(k) || originalText.includes(k))) {
      const reply = lang === 'hi'
        ? 'जी बिल्कुल, पेज खोल रहा हूं।'
        : 'Sure, opening that page for you.';
      return { reply, lang, action: { type: 'navigate', page } };
    }
  }

  // 3. Check business insight keywords
  const isInsightQuestion = INSIGHT_KEYWORDS.some((k) =>
    text.includes(k.toLowerCase()) || originalText.includes(k)
  );

  if (isInsightQuestion) {
    try {
      const data = await insightsService.getBusinessInsights(storeId);
      return buildInsightReply(data, lang);
    } catch (e: any) {
      logger.warn({ err: e?.message }, 'Insight fetch failed in fallback');
    }
  }

  // 4. Default
  const reply = lang === 'hi'
    ? 'मैं दुकानसाथी हूं। आप मुझसे अपनी दुकान के बारे में कुछ भी पूछ सकते हैं। जैसे "कितना फायदा हुआ?", "सामान दिखाओ", "क्या मंगाना है?", या "कारोबार कैसा चल रहा है?"'
    : 'I\'m DukaanSathi, your store assistant. Ask me about your business — like "Am I profitable?", "Show products", "What to restock?", or "How is my business doing?"';
  return { reply, lang };
}

function buildInsightReply(data: any, lang: 'hi' | 'en'): AssistantResponse {
  const { revenue, profit, stock, topProducts } = data;

  if (lang === 'hi') {
    const parts: string[] = [];

    if (profit.isProfitable) {
      parts.push(`जी हां, आपकी दुकान फायदे में है। पिछले 30 दिनों में ₹${fmt(revenue.last30Days)} की बिक्री हुई और ₹${fmt(profit.grossProfit30d)} का मुनाफा हुआ। मार्जिन ${profit.margin}% है।`);
    } else {
      parts.push(`अभी दुकान में ₹${fmt(Math.abs(profit.grossProfit30d))} का घाटा चल रहा है। बिक्री ₹${fmt(revenue.last30Days)} हुई लेकिन लागत ₹${fmt(profit.totalCost30d)} आई।`);
    }

    if (revenue.growth > 5) {
      parts.push(`अच्छी बात है कि बिक्री पिछले महीने से ${revenue.growth}% बढ़ी है।`);
    } else if (revenue.growth < -5) {
      parts.push(`बिक्री पिछले महीने से ${Math.abs(revenue.growth)}% कम हुई है, इस पर ध्यान दीजिए।`);
    }

    if (topProducts.length > 0) {
      parts.push(`सबसे ज़्यादा बिकने वाला सामान: ${topProducts.slice(0, 3).map((p: any) => p.name).join(', ')}।`);
    }

    if (stock.lowStockCount > 0) {
      parts.push(`${stock.lowStockCount} सामान कम हो रहे हैं, जल्दी मंगाइए।`);
    }

    if (stock.deadStockCount > 0) {
      parts.push(`${stock.deadStockCount} सामान 30 दिन से बिके नहीं, इन पर डिस्काउंट लगाइए।`);
    }

    parts.push('और कुछ पूछना हो तो बोलिए!');
    return { reply: parts.join(' '), lang };
  }

  // English
  const parts: string[] = [];

  if (profit.isProfitable) {
    parts.push(`Yes, your store is profitable! In the last 30 days you earned ₹${fmt(revenue.last30Days)} in revenue with ₹${fmt(profit.grossProfit30d)} profit. That's a ${profit.margin}% margin.`);
  } else {
    parts.push(`Your store is currently at a loss of ₹${fmt(Math.abs(profit.grossProfit30d))}. Revenue was ₹${fmt(revenue.last30Days)} but costs were ₹${fmt(profit.totalCost30d)}.`);
  }

  if (revenue.growth > 5) {
    parts.push(`Good news — sales are up ${revenue.growth}% from last month.`);
  } else if (revenue.growth < -5) {
    parts.push(`Sales dropped ${Math.abs(revenue.growth)}% from last month, needs attention.`);
  }

  if (topProducts.length > 0) {
    parts.push(`Your top sellers are ${topProducts.slice(0, 3).map((p: any) => p.name).join(', ')}.`);
  }

  if (stock.lowStockCount > 0) {
    parts.push(`${stock.lowStockCount} items are running low, order soon.`);
  }

  if (stock.deadStockCount > 0) {
    parts.push(`${stock.deadStockCount} items haven't sold in 30 days, consider discounting them.`);
  }

  parts.push('What else would you like to know?');
  return { reply: parts.join(' '), lang };
}

function detectLang(text: string): 'hi' | 'en' {
  // Check for Devanagari characters
  if (/[\u0900-\u097F]/.test(text)) return 'hi';

  // Check for Romanized Hindi words
  const hindiRoman = /\b(kya|kaise|kitna|kitni|mera|meri|dukaan|saamaan|bikri|fayda|nuksan|munafa|dikhao|batao|chahiye|karo|haan|nahi|acha|theek|shukriya|dhanyavaad|namaste|bhai|ji)\b/i;
  if (hindiRoman.test(text)) return 'hi';

  return 'en';
}

function buildStoreContext(data: any): string {
  const { revenue, profit, sales, stock, topProducts, slowProducts } = data;
  return [
    `Revenue: Today ₹${revenue.today}, Last 7 days ₹${revenue.last7Days}, Last 30 days ₹${revenue.last30Days}`,
    `Previous 30 days revenue: ₹${revenue.prev30Days}, Growth: ${revenue.growth}%`,
    `Profit: ₹${profit.grossProfit30d} (margin ${profit.margin}%), Cost: ₹${profit.totalCost30d}, Profitable: ${profit.isProfitable}`,
    `Sales: ${sales.unitsLast30} units in ${sales.transactionsLast30} transactions, Avg transaction: ₹${sales.avgTransactionValue}`,
    `Stock: ${stock.totalProducts} products, ${stock.lowStockCount} low, ${stock.outOfStockCount} out of stock, ${stock.deadStockCount} dead stock`,
    `Low stock items: ${stock.lowStockItems.join(', ') || 'none'}`,
    `Dead stock items: ${stock.deadStockItems.join(', ') || 'none'}`,
    `Stock value (cost): ₹${stock.totalStockValue}, (retail): ₹${stock.totalRetailValue}`,
    `Top sellers: ${topProducts.map((p: any) => `${p.name} (₹${p.revenue})`).join(', ') || 'none'}`,
    `Slow sellers: ${slowProducts.map((p: any) => `${p.name} (₹${p.revenue})`).join(', ') || 'none'}`,
  ].join('\n');
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-IN').format(Math.round(n));
}

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Classify a news item against task definitions
async function classifyNews(newsItem, taskDefs, companyName) {
  const taskList = taskDefs
    .map(
      (t) =>
        `ID:${t.id} | "${t.name}" | Keywords: ${(t.keywords || []).join(", ")} | Sources: ${(t.sources || []).join(", ")}`
    )
    .join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are a B2B signal classification engine. Given a news headline about a company and a list of task definitions, determine which tasks (if any) this news item triggers. Consider keyword matches, semantic relevance, and signal intent. Return ONLY a JSON object: {"matchedTaskIds": ["id1", "id2"], "confidence": 0.0-1.0, "reasoning": "brief explanation"}. If no tasks match, return {"matchedTaskIds": [], "confidence": 0, "reasoning": "No relevant signal detected"}.`,
        },
        {
          role: "user",
          content: `Company: ${companyName}\nHeadline: "${newsItem.headline}"\nDescription: "${newsItem.description || ""}"\n\nTask Definitions:\n${taskList}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Classification error:", e);
    return { matchedTaskIds: [], confidence: 0, reasoning: "Classification failed" };
  }
}

// Refine a vague task description into a structured task definition
async function refineTask(userInput) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: `You are an expert B2B sales signal architect. Given a rough description of a business signal, produce a structured task definition for an AI signal detection system. Return ONLY a JSON object with:
{
  "name": "Concise task name (max 60 chars)",
  "description": "2-3 sentence explanation of what this signal means and why it matters for sales outreach",
  "ease": "Easy|Medium|Hard" (how easy is this to detect from public sources),
  "strength": "Strong|Medium|Weak" (how strongly this correlates with buying intent),
  "sources": ["News", "New Hires", "Job Posts", "Social", "Exits / Promotions", "Custom", "Earnings", "SEC Filings"] (pick relevant ones),
  "keywords": ["keyword1", "keyword2", ...] (5-8 specific keywords for matching)
}`,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    return { success: true, task: JSON.parse(cleaned) };
  } catch (e) {
    console.error("Task refinement error:", e);
    return { success: false, error: "Failed to refine task" };
  }
}

// Generate AI insights for a specific task
async function generateInsights(task, companyName) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: `You are a B2B sales intelligence analyst. Given a detected signal task and company, provide actionable insights. Return ONLY a JSON object:
{
  "insights": [{"icon": "emoji", "text": "insight text"}],
  "suggestedActions": ["action 1", "action 2", "action 3"],
  "urgency": "Critical|High|Moderate|Low",
  "talkingPoints": ["point 1", "point 2"]
}`,
        },
        {
          role: "user",
          content: `Company: ${companyName}\nSignal: "${task.taskName}"\nDescription: ${task.taskDescription || task.taskName}\nScore: ${task.score}/10\nEase: ${task.ease}\nStrength: ${task.strength}\nTriggering headline: "${task.newsHeadline || "N/A"}"`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    return { success: true, data: JSON.parse(cleaned) };
  } catch (e) {
    console.error("Insights error:", e);
    return { success: false, error: "Failed to generate insights" };
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    switch (action) {
      case "classify": {
        const { newsItem, taskDefs, companyName } = body;
        const result = await classifyNews(newsItem, taskDefs, companyName);
        return NextResponse.json(result);
      }

      case "refine": {
        const { userInput } = body;
        const result = await refineTask(userInput);
        return NextResponse.json(result);
      }

      case "insights": {
        const { task, companyName } = body;
        const result = await generateInsights(task, companyName);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Classify API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

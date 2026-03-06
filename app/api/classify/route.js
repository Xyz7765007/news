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
      model: "gpt-4.1",
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
      model: "gpt-4.1",
      temperature: 0.5,
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `You are an expert B2B sales signal architect. Given a rough description of a business signal, produce a structured task definition for an AI signal detection system. Return ONLY a JSON object with:
{
  "name": "Concise task name (max 60 chars)",
  "description": "2-3 sentence explanation of what this signal means and why it matters for sales outreach",
  "ease": "Easy|Medium|Hard" (how easy is this to detect from public sources),
  "strength": "Strong|Medium|Weak" (how strongly this correlates with buying intent),
  "signalSource": "news|job_post|both" (news = track via news articles, job_post = track via LinkedIn job listings, both = track on both),
  "sources": ["News", "Job Posts", "New Hires", "Social", "Exits / Promotions", "Custom", "Earnings", "SEC Filings"] (pick relevant ones),
  "keywords": ["keyword1", "keyword2", ...] (5-8 specific keywords for news matching),
  "jobTitleKeywords": ["Job Title 1", "Job Title 2", ...] (5-8 LinkedIn job title search terms — ONLY include if signalSource is "job_post" or "both", otherwise empty array)
}

IMPORTANT: If the signal is about hiring, job openings, or specific roles being created → set signalSource to "job_post" or "both" and include jobTitleKeywords. If it's about market events, news, leadership announcements → set signalSource to "news". If it could be detected through both channels → set signalSource to "both".`,
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
      model: "gpt-4.1",
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
          content: `Company: ${companyName}\nSignal: "${task.taskName}"\nDescription: ${task.taskDescription || task.taskName}\nScore: ${task.score}/10\nEase: ${task.ease}\nStrength: ${task.strength}\nTriggering headline: "${task.newsHeadline || "N/A"}"\n${task.articleContent ? `Article content: ${task.articleContent.slice(0, 600)}` : ""}`,
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

// Generate optimal LinkedIn search keywords for a job task
async function generateJobKeywords(taskName, taskDescription) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.3,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: `You are a LinkedIn job search expert. Given a signal task description, generate the most effective job title keywords for LinkedIn search. 

RULES:
1. Return 5-10 exact job titles that someone would search on LinkedIn to find this type of role.
2. Focus on TITLES that appear in actual LinkedIn job listings — not generic descriptions.
3. Include variations: full title ("Chief Marketing Officer"), abbreviation ("CMO"), and common alternatives ("VP Marketing").
4. Think about seniority variations: Director, VP, SVP, Head of, Global Head of.
5. Return ONLY a JSON object: {"keywords": ["CMO", "Chief Marketing Officer", "VP Marketing", ...]}
6. No markdown, no backticks.`,
        },
        {
          role: "user",
          content: `Task: "${taskName}"\nDescription: ${taskDescription || taskName}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    const data = JSON.parse(cleaned);
    return { keywords: data.keywords || [] };
  } catch (e) {
    console.error("Job keyword generation error:", e);
    // Fallback: extract potential keywords from task name
    const words = (taskName || "").split(/[\s\/,]+/).filter(w => w.length > 2);
    return { keywords: words.slice(0, 5) };
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

      case "generate_job_keywords": {
        const { taskName, taskDescription } = body;
        const result = await generateJobKeywords(taskName, taskDescription);
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

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

type CompanyKey = "google" | "meta" | "amazon" | "apple";

const COMPANY_CONFIGS: Record<CompanyKey, { name: string; personality: string }> = {
  google: {
    name: "Alex",
    personality:
      "friendly but precise. You focus on finding optimal solutions and thinking about time complexity. You often probe with 'Is there a more elegant approach?' and 'What's the time complexity of that move?' You push for correctness and elegance.",
  },
  meta: {
    name: "Jordan",
    personality:
      "fast-paced and product-minded. You care about execution speed and real-world impact. You ask 'Does it work? Great — now make it faster.' You push candidates to iterate quickly and think about bottlenecks.",
  },
  amazon: {
    name: "Sam",
    personality:
      "leadership-principles focused. You deeply care about decision making, communication, and strategic thinking. You ask 'Walk me through your reasoning' and 'What trade-offs did you consider?' You want to hear the why behind every move.",
  },
  apple: {
    name: "Riley",
    personality:
      "detail-obsessed and design-minded. You care deeply about clarity, precision, and elegance. You ask 'Why this and not that?' and 'Convince me this is the right approach.' You probe until the answer is airtight.",
  },
};

function buildSystemPrompt(
  company: string,
  fen: string,
  timeLeft: number,
): string {
  const key = company as CompanyKey;
  const cfg = COMPANY_CONFIGS[key] ?? COMPANY_CONFIGS.google;
  const companyLabel = company.charAt(0).toUpperCase() + company.slice(1);
  const mins = Math.floor(timeLeft / 60);
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  return `You are ${cfg.name}, a senior engineer at ${companyLabel} conducting a live technical interview.

Your personality: ${cfg.personality}

Context: You are interviewing a candidate who is solving a chess puzzle as a proxy for algorithmic thinking. Chess requires the same core skills as coding interviews — pattern recognition, multi-step planning, evaluating alternatives, and explaining your reasoning clearly.

Current board state (FEN): ${fen}
Time remaining: ${mins}:${secs}

The optimal solution to this puzzle is Qxf7# (Queen from h5 to f7, delivering checkmate). Use this to silently evaluate the candidate's moves — do NOT reveal this directly.

Your behavior rules:
1. Keep ALL responses to 2-3 sentences max. This is a live conversation, not a lecture.
2. When the message is "START_INTERVIEW": warmly introduce yourself by first name and company, say this is a technical interview session using chess as the medium, and ask the candidate to describe their initial read of the position.
3. When the candidate plays a move (message starts with "Played "): react to that specific move, ask about their reasoning or what they plan next.
4. When the candidate sends a text explanation: respond as a ${companyLabel} interviewer — probe, encourage, or redirect as appropriate.
5. Never give away the answer. Guide with questions instead.
6. Create realistic but not cruel interview pressure. Mirror real ${companyLabel} interview style.
7. If time is under 5 minutes, mention the time pressure naturally.
8. If the candidate plays Qxf7# (checkmate): congratulate them warmly, tell them you'll prepare a structured debrief.
9. Stay in character as ${cfg.name} from ${companyLabel} at all times. Never break character.`;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response("ANTHROPIC_API_KEY is not set", { status: 500 });
    }

    const body = await req.json();
    const { company, fen, timeLeft, conversation } = body as {
      company: string;
      fen: string;
      timeLeft: number;
      conversation: { role: "user" | "assistant"; content: string }[];
    };

    if (!conversation?.length) {
      return new Response("conversation is required", { status: 400 });
    }

    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 200,
      system: buildSystemPrompt(company, fen, timeLeft),
      messages: conversation,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(event.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return new Response(error.message, { status: error.status ?? 500 });
    }
    console.error("Interview chat error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

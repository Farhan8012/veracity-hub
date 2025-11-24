import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claim } = await req.json();
    
    if (!claim || typeof claim !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'claim' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a fact-checking assistant. Analyze news claims and determine their veracity.
Return a verdict of "True", "False", or "Uncertain" along with a confidence score (0-100) and brief reasoning.

Guidelines:
- "True": The claim is factually accurate and supported by evidence
- "False": The claim is demonstrably false or misleading
- "Uncertain": Insufficient evidence or requires more context
- Confidence: Higher scores indicate stronger certainty in the verdict
- Reasoning: Provide a brief explanation (2-3 sentences) for your verdict`;

    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this news claim: "${claim}"` }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "verify_claim",
            description: "Return the fact-check verdict for a news claim",
            parameters: {
              type: "object",
              properties: {
                verdict: {
                  type: "string",
                  enum: ["True", "False", "Uncertain"],
                  description: "The factual verdict of the claim"
                },
                confidence: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Confidence score from 0-100"
                },
                reasoning: {
                  type: "string",
                  description: "Brief explanation for the verdict (2-3 sentences)"
                }
              },
              required: ["verdict", "confidence", "reasoning"],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "verify_claim" } }
    };

    console.log("Calling Lovable AI Gateway for claim verification...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log("AI Response:", JSON.stringify(result, null, 2));

    // Extract the tool call result
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const verification = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        claim,
        verdict: verification.verdict,
        confidence: verification.confidence,
        reasoning: verification.reasoning,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("verify-news error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

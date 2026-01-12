import { http, HttpResponse } from "msw";

/**
 * OpenRouter API handlers
 * https://openrouter.ai/docs
 */
export const openRouterHandlers = [
  // Chat completions endpoint
  http.post("https://openrouter.ai/api/v1/chat/completions", () => {
    return HttpResponse.json({
      id: "gen-mock-12345",
      model: "openai/gpt-4o",
      object: "chat.completion",
      created: Date.now(),
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              subject: "Welcome to Our Service",
              previewText: "Get started with your new account",
              styleType: "STYLE_OBJECTS",
              reactEmailCode: `
import { Html, Head, Body, Container, Text, Button } from "@react-email/components";

export default function Email() {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#ffffff" }}>
        <Container>
          <Text>Welcome!</Text>
          <Button href="https://example.com">Get Started</Button>
        </Container>
      </Body>
    </Html>
  );
}`.trim(),
            }),
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300,
      },
    });
  }),
];

/**
 * FAL AI handlers
 * https://fal.ai/docs
 */
export const falHandlers = [
  // Text to image generation
  http.post("https://fal.run/*", () => {
    return HttpResponse.json({
      images: [
        {
          url: "https://fal.media/files/mock-image-12345.png",
          width: 1024,
          height: 1024,
          content_type: "image/png",
        },
      ],
      timings: {
        inference: 1.5,
      },
      seed: 12345,
      has_nsfw_concepts: [false],
      prompt: "A beautiful landscape",
    });
  }),

  // Queue status check
  http.get("https://queue.fal.run/*", () => {
    return HttpResponse.json({
      status: "COMPLETED",
      request_id: "mock-request-12345",
    });
  }),
];

/**
 * Stripe API handlers (for webhook testing)
 */
export const stripeHandlers = [
  // Create billing portal session
  http.post("https://api.stripe.com/v1/billing_portal/sessions", () => {
    return HttpResponse.json({
      id: "bps_mock_12345",
      object: "billing_portal.session",
      url: "https://billing.stripe.com/session/mock_session",
      return_url: "https://mocah.io/dashboard",
    });
  }),

  // Get customer
  http.get("https://api.stripe.com/v1/customers/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      object: "customer",
      email: "test@mocah.io",
      name: "Test User",
      created: Date.now() / 1000,
    });
  }),

  // List invoices
  http.get("https://api.stripe.com/v1/invoices", () => {
    return HttpResponse.json({
      object: "list",
      data: [
        {
          id: "in_mock_12345",
          object: "invoice",
          number: "INV-001",
          status: "paid",
          total: 2999, // $29.99 in cents
          currency: "usd",
          created: Date.now() / 1000,
          period_start: Date.now() / 1000 - 30 * 24 * 60 * 60,
          period_end: Date.now() / 1000,
          hosted_invoice_url: "https://invoice.stripe.com/i/mock",
          invoice_pdf: "https://invoice.stripe.com/pdf/mock.pdf",
        },
      ],
      has_more: false,
    });
  }),

  // Update subscription (for ending trial)
  http.post("https://api.stripe.com/v1/subscriptions/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      object: "subscription",
      status: "active",
      current_period_start: Date.now() / 1000,
      current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
    });
  }),
];

/**
 * Firecrawl API handlers (brand scraping)
 */
export const firecrawlHandlers = [
  http.post("https://api.firecrawl.dev/v1/scrape", () => {
    return HttpResponse.json({
      success: true,
      data: {
        markdown: "# Company Name\n\nWelcome to our website...",
        metadata: {
          title: "Company Name - Homepage",
          description: "We provide excellent services",
          ogImage: "https://example.com/og-image.png",
        },
        screenshot: "https://firecrawl.dev/screenshots/mock.png",
      },
    });
  }),
];

/**
 * All handlers combined
 */
export const handlers = [
  ...openRouterHandlers,
  ...falHandlers,
  ...stripeHandlers,
  ...firecrawlHandlers,
];


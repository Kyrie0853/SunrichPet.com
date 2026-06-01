import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "未配置" }, { status: 500 });
  }
  const { stripe } = await import("@/lib/stripe/server");
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "签名验证失败" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;
    if (orderId) {
      const supabase = await createClient();
      const paidAt = new Date().toISOString();
      await supabase.from("orders").update({
        status: "paid",
        stripe_session_id: session.id,
      }).eq("id", orderId);

      // 记录日志
      await supabase.from("order_logs").insert({
        order_id: orderId,
        action: "paid",
        details: { stripeSessionId: session.id, paidAt },
      });
    }
  }
  return NextResponse.json({ received: true });
}

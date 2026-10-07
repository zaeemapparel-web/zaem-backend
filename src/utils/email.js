import { Resend } from "resend";

// ==================== INIT ====================
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.EMAIL_FROM || "ZAEM <orders@zaemstore.com>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "zaemlifestyle@gmail.com";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://zaemstore.com";

// ==================== SEND EMAIL ====================
export async function sendEmail({ to, subject, html, replyTo }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️  RESEND_API_KEY not set — email skipped");
    return { success: false, error: "Email not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      reply_to: replyTo || REPLY_TO,
    });

    if (error) {
      console.error("❌ Email send error:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Email sent:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("❌ Email exception:", error);
    return { success: false, error: error.message };
  }
}

// ==================== SHORTCUT FUNCTIONS ====================

export async function sendOrderConfirmation(order) {
  const { orderConfirmationTemplate } = await import(
    "./emailTemplates/orderConfirmation.js"
  );
  return sendEmail({
    to: order.user.email,
    subject: `Order Confirmed — ${order.orderNumber} | ZAEM`,
    html: orderConfirmationTemplate(order, FRONTEND_URL),
  });
}

export async function sendOrderShipped(order) {
  const { orderShippedTemplate } = await import(
    "./emailTemplates/orderShipped.js"
  );
  return sendEmail({
    to: order.user.email,
    subject: `Your Order is on the Way — ${order.orderNumber} | ZAEM`,
    html: orderShippedTemplate(order, FRONTEND_URL),
  });
}

export async function sendOrderDelivered(order) {
  const { orderDeliveredTemplate } = await import(
    "./emailTemplates/orderDelivered.js"
  );
  return sendEmail({
    to: order.user.email,
    subject: `Order Delivered — ${order.orderNumber} | ZAEM`,
    html: orderDeliveredTemplate(order, FRONTEND_URL),
  });
}

export async function sendWelcomeEmail(user) {
  const { welcomeTemplate } = await import("./emailTemplates/welcome.js");
  return sendEmail({
    to: user.email,
    subject: "Welcome to ZAEM — Style. Redefined.",
    html: welcomeTemplate(user, FRONTEND_URL),
  });
}

// ==================== PASSWORD RESET EMAIL ====================
export async function sendPasswordResetEmail(user, resetUrl) {
  const { passwordResetTemplate } = await import(
    "./emailTemplates/password-reset.js"
  );
  return sendEmail({
    to: user.email,
    subject: "Reset Your Password — ZAEM",
    html: passwordResetTemplate(user, resetUrl),
  });
}
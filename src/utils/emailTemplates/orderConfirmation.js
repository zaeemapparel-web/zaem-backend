export const orderConfirmationTemplate = (order, frontendUrl) => {
  const items = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #E5E5E7;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="80" valign="top">
                ${
                  item.image
                    ? `<img src="${item.image}" alt="${item.name}" width="80" height="100" style="border-radius: 8px; object-fit: cover; display: block;" />`
                    : `<div style="width:80px;height:100px;background:#F5F5F7;border-radius:8px;"></div>`
                }
              </td>
              <td valign="top" style="padding-left: 16px;">
                <p style="margin: 0 0 4px; font-size: 15px; font-weight: 500; color: #1D1D1F; font-family: 'Helvetica Neue', Arial, sans-serif;">
                  ${item.name}
                </p>
                ${
                  item.size || item.color
                    ? `<p style="margin: 0 0 4px; font-size: 13px; color: #6E6E73; font-family: 'Helvetica Neue', Arial, sans-serif;">
                        ${item.size ? `Size: ${item.size}` : ""}${item.size && item.color ? " · " : ""}${item.color ? `Color: ${item.color}` : ""}
                      </p>`
                    : ""
                }
                <p style="margin: 8px 0 0; font-size: 14px; color: #1D1D1F; font-family: 'Helvetica Neue', Arial, sans-serif;">
                  Qty: ${item.quantity} × Rs. ${item.price.toLocaleString()}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F7; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5F5F7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden;">
          
          <!-- HEADER -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; border-bottom: 1px solid #E5E5E7;">
              <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 400; letter-spacing: 0.15em; color: #1D1D1F;">
                ZAEM
              </h1>
              <p style="margin: 6px 0 0; font-size: 10px; letter-spacing: 0.35em; color: #86868B; text-transform: uppercase;">
                EST. 2026
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; width: 64px; height: 64px; background: #E8F5E9; border-radius: 50%; line-height: 64px; text-align: center; font-size: 32px;">
                  ✓
                </div>
                <h2 style="margin: 16px 0 8px; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 400; color: #1D1D1F;">
                  Thank you for your order
                </h2>
                <p style="margin: 0; font-size: 14px; color: #6E6E73;">
                  Hi ${order.user.name?.split(" ")[0] || "there"}, your order has been confirmed.
                </p>
              </div>

              <!-- Order Info -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #FAFAFA; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #86868B; padding-bottom: 4px;">
                          Order Number
                        </td>
                        <td align="right" style="font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #86868B; padding-bottom: 4px;">
                          Date
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 15px; font-weight: 600; color: #1D1D1F;">
                          ${order.orderNumber}
                        </td>
                        <td align="right" style="font-size: 15px; color: #1D1D1F;">
                          ${new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Items -->
              <h3 style="margin: 0 0 16px; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; color: #86868B; font-weight: 500;">
                Order Items
              </h3>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                ${items}
              </table>

              <!-- Totals -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #6E6E73;">Subtotal</td>
                  <td align="right" style="padding: 6px 0; font-size: 14px; color: #1D1D1F;">Rs. ${order.subtotal.toLocaleString()}</td>
                </tr>
                ${
                  order.discount > 0
                    ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #6E6E73;">Discount</td>
                  <td align="right" style="padding: 6px 0; font-size: 14px; color: #2E7D32;">− Rs. ${order.discount.toLocaleString()}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #6E6E73;">Shipping</td>
                  <td align="right" style="padding: 6px 0; font-size: 14px; color: #1D1D1F;">${order.shippingCost === 0 ? "Free" : `Rs. ${order.shippingCost.toLocaleString()}`}</td>
                </tr>
                <tr>
                  <td style="padding: 16px 0 0; font-size: 16px; font-weight: 600; color: #1D1D1F; border-top: 1px solid #E5E5E7;">Total</td>
                  <td align="right" style="padding: 16px 0 0; font-size: 16px; font-weight: 600; color: #1D1D1F; border-top: 1px solid #E5E5E7;">Rs. ${order.total.toLocaleString()}</td>
                </tr>
              </table>

              <!-- Shipping Address -->
              <h3 style="margin: 0 0 12px; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; color: #86868B; font-weight: 500;">
                Shipping Address
              </h3>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #FAFAFA; border-radius: 12px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 4px; font-size: 14px; font-weight: 500; color: #1D1D1F;">
                      ${order.address?.fullName || order.user.name}
                    </p>
                    <p style="margin: 0 0 4px; font-size: 14px; color: #6E6E73;">
                      ${order.address?.street || ""}
                    </p>
                    <p style="margin: 0 0 4px; font-size: 14px; color: #6E6E73;">
                      ${order.address?.city || ""}${order.address?.state ? ", " + order.address.state : ""} ${order.address?.postalCode || ""}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #6E6E73;">
                      ${order.address?.phone || ""}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}/account/orders/${order.id}" style="display: inline-block; padding: 14px 32px; background: #1D1D1F; color: #FFFFFF; text-decoration: none; border-radius: 999px; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500;">
                      Track Your Order
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 32px 40px; background: #FAFAFA; border-top: 1px solid #E5E5E7; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6E6E73;">
                Questions? Reply to this email or WhatsApp us at <strong>+92 319 3773788</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #86868B;">
                © 2026 ZAEM. Style. Redefined.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
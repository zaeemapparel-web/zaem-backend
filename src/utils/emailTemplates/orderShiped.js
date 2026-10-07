export const orderShippedTemplate = (order, frontendUrl) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Shipped</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F7; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5F5F7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background: #FFFFFF; border-radius: 16px; overflow: hidden;">
          
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; border-bottom: 1px solid #E5E5E7;">
              <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 400; letter-spacing: 0.15em; color: #1D1D1F;">
                ZAEM
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; width: 64px; height: 64px; background: #E3F2FD; border-radius: 50%; line-height: 64px; text-align: center; font-size: 32px;">
                  📦
                </div>
                <h2 style="margin: 16px 0 8px; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 400; color: #1D1D1F;">
                  Your order is on the way
                </h2>
                <p style="margin: 0; font-size: 14px; color: #6E6E73;">
                  Order ${order.orderNumber} has been shipped.
                </p>
              </div>

              ${
                order.trackingNumber
                  ? `
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #FAFAFA; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #86868B;">
                      Tracking Number
                    </p>
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1D1D1F; letter-spacing: 0.05em;">
                      ${order.trackingNumber}
                    </p>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    ${
                      order.trackingUrl
                        ? `<a href="${order.trackingUrl}" style="display: inline-block; padding: 14px 32px; background: #1D1D1F; color: #FFFFFF; text-decoration: none; border-radius: 999px; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500;">Track Your Order</a>`
                        : `<a href="${frontendUrl}/account/orders/${order.id}" style="display: inline-block; padding: 14px 32px; background: #1D1D1F; color: #FFFFFF; text-decoration: none; border-radius: 999px; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500;">View Order</a>`
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 40px; background: #FAFAFA; border-top: 1px solid #E5E5E7; text-align: center;">
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
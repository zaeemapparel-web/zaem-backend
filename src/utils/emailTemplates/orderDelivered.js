export const orderDeliveredTemplate = (order, frontendUrl) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Delivered</title>
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
                <div style="display: inline-block; width: 64px; height: 64px; background: #E8F5E9; border-radius: 50%; line-height: 64px; text-align: center; font-size: 32px;">
                  ✨
                </div>
                <h2 style="margin: 16px 0 8px; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 400; color: #1D1D1F;">
                  Order Delivered
                </h2>
                <p style="margin: 0; font-size: 14px; color: #6E6E73;">
                  We hope you love your new pieces.
                </p>
              </div>

              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.7; color: #6E6E73; text-align: center;">
                Thank you for shopping with ZAEM. Your order <strong style="color: #1D1D1F;">${order.orderNumber}</strong> has been delivered.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}/shop" style="display: inline-block; padding: 14px 32px; background: #1D1D1F; color: #FFFFFF; text-decoration: none; border-radius: 999px; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500;">
                      Continue Shopping
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0; font-size: 13px; color: #86868B; text-align: center;">
                Share your look with us on Instagram <a href="https://instagram.com/zaemstore" style="color: #1D1D1F;">@zaemstore</a>
              </p>
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
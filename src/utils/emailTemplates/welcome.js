export const welcomeTemplate = (user, frontendUrl) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to ZAEM</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F7; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5F5F7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background: #FFFFFF; border-radius: 16px; overflow: hidden;">
          
          <tr>
            <td style="padding: 48px 40px 24px; text-align: center; border-bottom: 1px solid #E5E5E7;">
              <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 400; letter-spacing: 0.15em; color: #1D1D1F;">
                ZAEM
              </h1>
              <p style="margin: 6px 0 0; font-size: 10px; letter-spacing: 0.35em; color: #86868B; text-transform: uppercase;">
                EST. 2026
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 48px 40px;">
              <h2 style="margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 400; color: #1D1D1F; text-align: center;">
                Welcome, ${user.name?.split(" ")[0] || "there"}.
              </h2>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #6E6E73; text-align: center;">
                We're delighted to have you with us. ZAEM is a curated world of premium clothing, signature fragrances, and artisan-crafted bags — designed for the discerning.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}/shop" style="display: inline-block; padding: 14px 40px; background: #1D1D1F; color: #FFFFFF; text-decoration: none; border-radius: 999px; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500;">
                      Explore the Collection
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td style="padding: 16px; background: #FAFAFA; border-radius: 12px; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #6E6E73;">
                      <strong style="color: #1D1D1F;">10% OFF</strong> your first order — use code <strong style="color: #1D1D1F;">WELCOME10</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 40px; background: #FAFAFA; border-top: 1px solid #E5E5E7; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6E6E73;">
                Follow us on Instagram <a href="https://instagram.com/zaemstore" style="color: #1D1D1F;">@zaemstore</a>
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
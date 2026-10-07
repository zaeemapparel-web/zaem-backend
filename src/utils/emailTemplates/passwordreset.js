export const passwordResetTemplate = (user, resetUrl) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F7; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F5F5F7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden;">
          
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

          <tr>
            <td style="padding: 48px 40px;">
              
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; width: 64px; height: 64px; background: #FFF3E0; border-radius: 50%; line-height: 64px; text-align: center; font-size: 32px;">
                  🔐
                </div>
              </div>

              <h2 style="margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 400; color: #1D1D1F; text-align: center;">
                Reset Your Password
              </h2>

              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.7; color: #6E6E73; text-align: center;">
                Hi ${user.name?.split(" ")[0] || "there"}, we received a request to reset your ZAEM account password.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; padding: 16px 48px; background: #1D1D1F; color: #FFFFFF; text-decoration: none; border-radius: 999px; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #FFF3E0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #E65100;">
                      ⏰ Link Expires in 1 Hour
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #E65100; opacity: 0.9;">
                      For your security, this link will expire in 60 minutes.
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #FAFAFA; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; font-size: 12px; color: #6E6E73; line-height: 1.6;">
                      <strong style="color: #1D1D1F;">Didn't request this?</strong> If you didn't ask to reset your password, you can safely ignore this email. Your account is secure.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0; font-size: 11px; color: #86868B; text-align: center; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <span style="color: #0A84FF; word-break: break-all; font-size: 10px;">${resetUrl}</span>
              </p>

            </td>
          </tr>

          <tr>
            <td style="padding: 32px 40px; background: #FAFAFA; border-top: 1px solid #E5E5E7; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #86868B;">
                Need help? Contact us at <strong>zaemlifestyle@gmail.com</strong>
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
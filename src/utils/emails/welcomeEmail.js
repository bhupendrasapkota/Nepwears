export const welcomeEmail = (firstName, lastName) => `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width:600px; margin:auto; padding:32px 24px; background:#fff; color:#111;">
    <h2 style="font-size:28px; font-weight:700; margin-bottom:24px; color:#000; letter-spacing:1px;">Welcome to Nepwears 🎉</h2>
    <p style="font-size:16px; margin-bottom:16px;">Hello ${firstName} ${lastName},</p>
    <p style="font-size:16px; margin-bottom:24px;">
      Thank you for registering with Nepwears. We're excited to have you on board!
    </p>
    <p style="font-size:14px; color:#555;">
      If you have any questions, feel free to reply to this email or reach out to our support.
    </p>
    <hr style="border:none; border-top:1px solid #eee; margin:40px 0 24px 0;">
    <p style="font-size:12px; color:#aaa; text-align:center;">
      &copy; ${new Date().getFullYear()} Nepwears. All rights reserved.
    </p>
  </div>
`;

export const passwordResetSuccessEmail = (firstName, lastName) => `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width:600px; margin:auto; padding:32px 24px; background:#fff; color:#111;">
    <h2 style="font-size:28px; font-weight:700; margin-bottom:24px; color:#000; letter-spacing:1px;">Password Reset Successful</h2>
    <p style="font-size:16px; margin-bottom:16px;">Hello ${firstName} ${lastName},</p>
    <p style="font-size:16px; margin-bottom:24px;">
      Your password has been reset successfully. You can now log in to your account using your new password.
    </p>
    <p style="font-size:16px; margin-bottom:24px;">
      If you did <strong>not</strong> perform this action, please secure your account immediately and contact our support team.
    </p>
    <p style="margin:32px 0;">
      <a href="support@nepwears.com"
         style="display:inline-block; background:#000; color:#fff; text-decoration:none; font-size:16px; font-weight:600; padding:14px 32px; border:none; border-radius:0; letter-spacing:2px;">
        CONTACT SUPPORT
      </a>
    </p>
    <hr style="border:none; border-top:1px solid #eee; margin:40px 0 24px 0;">
    <p style="font-size:12px; color:#aaa; text-align:center;">
      &copy; ${new Date().getFullYear()} Nepwears. All rights reserved.
    </p>
  </div>
`;

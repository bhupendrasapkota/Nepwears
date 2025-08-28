export const notifyDeletedAccountEmail = (firstName) => `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width:600px; margin:auto; padding:32px 24px; background:#fff; color:#111;">
    <h2 style="font-size:28px; font-weight:700; margin-bottom:24px; color:#000;">Account Deleted</h2>
    <p style="font-size:16px; margin-bottom:16px;">Hi ${firstName},</p>
    <p style="font-size:16px; margin-bottom:24px;">
      Your Nepwears account has been deleted by an administrator. If you believe this was done in error or have any questions, please contact our support team.
    </p>
    <p style="font-size:14px; color:#555; margin-top:40px;">
      If you still need access to our platform, you may create a new account or reach out for assistance.
    </p>
    <hr style="border:none; border-top:1px solid #eee; margin:40px 0 24px 0;">
    <p style="font-size:12px; color:#aaa; text-align:center;">
      &copy; ${new Date().getFullYear()} Nepwears. All rights reserved.
    </p>
  </div>
`;

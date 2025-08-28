export const adminUserCreatedEmail = (
  firstName,
  lastName,
  email,
  password
) => `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width:600px; margin:auto; padding:32px 24px; background:#fff; color:#111;">
    <h2 style="font-size:26px; font-weight:700; margin-bottom:24px; color:#000; letter-spacing:1px;">
      Admin Account Created
    </h2>

    <p style="font-size:16px; margin-bottom:16px;">
      Hello ${firstName} ${lastName},
    </p>

    <p style="font-size:16px; margin-bottom:24px;">
      An admin has created an account for you on <strong>Nepwears</strong> with administrative privileges.
      Below are your login credentials:
    </p>

    <div style="font-size:16px; background:#f5f5f5; padding:16px; border-radius:4px; margin-bottom:24px;">
      <strong>Email:</strong> ${email}<br>
      <strong>Temporary Password:</strong> ${password}
    </div>

    <p style="font-size:15px; margin-bottom:24px; color:#222;">
      Please log in as soon as possible and update your password to ensure the security of your account.
    </p>

    <p style="font-size:15px; margin-bottom:16px; color:#222;">
      As an admin, you have access to sensitive features. Make sure you:
    </p>

    <ul style="font-size:15px; color:#222; padding-left:20px; margin-bottom:24px;">
      <li>Keep your credentials confidential.</li>
      <li>Do not share your account with others.</li>
      <li>Log out when using shared or public devices.</li>
    </ul>

    <p style="font-size:14px; color:#555;">
      If you did not expect this email or believe it was sent in error, please contact your system administrator immediately.
    </p>

    <hr style="border:none; border-top:1px solid #eee; margin:40px 0 24px 0;">

    <p style="font-size:12px; color:#aaa; text-align:center;">
      &copy; ${new Date().getFullYear()} Nepwears. All rights reserved.
    </p>
  </div>
`;

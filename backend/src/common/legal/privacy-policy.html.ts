/** Full Privacy Policy HTML served at GET /api/v1/privacy */
export const PRIVACY_POLICY_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="SugarBF Privacy Policy" />
  <title>Privacy Policy | SugarBF</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0d0d0d;
      --text: #fff7e8;
      --muted: #cdbdc5;
      --gold: #ffd166;
      --border: rgba(255, 209, 102, 0.22);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: linear-gradient(145deg, #2a0018 0%, var(--bg) 45%);
      color: var(--text);
      font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif;
      font-size: 16px;
      line-height: 1.7;
    }
    a { color: var(--gold); }
    .wrap { width: min(100% - 32px, 880px); margin: 0 auto; padding: 48px 0 72px; }
    .brand { font-size: 1.35rem; font-weight: 800; letter-spacing: 0.02em; text-decoration: none; color: var(--text); }
    .brand span { color: var(--gold); }
    h1 { margin: 28px 0 8px; font-size: clamp(2rem, 6vw, 3.4rem); line-height: 1.1; letter-spacing: -0.03em; }
    .meta { color: var(--muted); margin: 0 0 28px; }
    .notice {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px 18px;
      margin: 0 0 32px;
      background: rgba(255, 209, 102, 0.08);
    }
    h2 { margin: 36px 0 12px; font-size: 1.35rem; }
    h3 { margin: 22px 0 8px; color: #ffe8a6; font-size: 1.05rem; }
    p, ul { margin: 0 0 14px; }
    li + li { margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; }
    th, td { text-align: left; vertical-align: top; padding: 12px; border-bottom: 1px solid var(--border); }
    th { color: var(--gold); font-size: 0.85rem; }
    footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <a class="brand" href="https://sugarbf.club">Sugar<span>BF</span></a>
    <h1>Privacy Policy</h1>
    <p class="meta"><strong>Effective date:</strong> 25 July 2026 &nbsp;·&nbsp; <strong>Last updated:</strong> 25 July 2026</p>

    <div class="notice">
      <strong>Adults only.</strong> SugarBF is intended only for people who are at least 18 years old.
      We do not knowingly allow minors to use the app.
    </div>

    <p>
      This Privacy Policy explains how SugarBF (“SugarBF,” “we,” “us,” or “our”) collects, uses,
      shares, stores, and protects information when you use the SugarBF mobile application and
      related services (the “Services”).
    </p>

    <h2>1. Information we collect</h2>

    <h3>Account and identity</h3>
    <p>
      We collect information used to create and secure your account, including phone number and,
      depending on how you sign in, name, email address, profile picture, and identifiers from
      Google, Facebook, Apple, or Firebase Authentication.
    </p>

    <h3>Profile and preferences</h3>
    <p>
      You may provide name, age or date of birth, gender, city, country, bio, role, matching
      preferences, lifestyle details, allowance or accommodation preferences, referral codes, and
      other profile information you choose to add.
    </p>

    <h3>Photos and face verification</h3>
    <p>
      We collect profile photos you upload. If you verify your profile, we also collect a selfie
      and use Amazon Rekognition to compare faces between your selfie and profile photo. We store
      the verification status and confidence score. This processing may involve facial geometry or
      biometric-related data under applicable law. It is used only for authenticity, trust, fraud
      prevention, and safety.
    </p>

    <h3>Location</h3>
    <p>
      With your device permission, we collect approximate or precise foreground location
      (latitude, longitude, and update time) to power nearby discovery. SugarBF does not require
      background location. You can disable location in device settings; nearby features may then
      be limited.
    </p>

    <h3>Communications and activity</h3>
    <p>
      We process messages, compliments, likes, passes, super likes, matches, blocks, reports, and
      related timestamps. Messages are not end-to-end encrypted. Do not send passwords, payment
      card details, or government IDs in chat.
    </p>

    <h3>Purchases and subscriptions</h3>
    <p>
      Purchases are processed by Google Play. We do not receive your full card details. We receive
      product ID, purchase token, order ID, amount, currency, and subscription status/dates so we
      can verify purchases and unlock paid features and coins.
    </p>

    <h3>Device and technical data</h3>
    <p>
      We collect platform, device model, app version, push notification token, IP address, request
      logs, authentication tokens, and security or error information. The app stores a login token
      and a local copy of your profile on your device so you stay signed in.
    </p>

    <h3>Support and safety</h3>
    <p>
      If you contact us or report a user, we collect the information you submit, related account
      details, and moderation records such as warnings, blocks, and bans.
    </p>

    <h2>2. How we use information</h2>
    <ul>
      <li>create, authenticate, maintain, and secure accounts;</li>
      <li>build profiles and show relevant discovery results;</li>
      <li>provide matching, messaging, likes, compliments, and referrals;</li>
      <li>verify authenticity and help prevent impersonation, fraud, and abuse;</li>
      <li>process and verify subscriptions and coin purchases;</li>
      <li>send service, security, and push notifications;</li>
      <li>investigate reports and enforce our rules;</li>
      <li>provide support and improve reliability; and</li>
      <li>comply with legal obligations.</li>
    </ul>
    <p>
      We do not sell your personal information. We do not use private messages or verification
      selfies for third-party advertising.
    </p>

    <h2>3. Legal bases</h2>
    <p>Where required by law, we rely on:</p>
    <ul>
      <li><strong>Contract</strong> — to provide the Services and manage purchases;</li>
      <li><strong>Consent</strong> — for location, notifications, optional profile details, and face verification where required;</li>
      <li><strong>Legitimate interests</strong> — to operate, secure, and protect SugarBF and users; and</li>
      <li><strong>Legal obligations</strong> — to comply with applicable law and lawful requests.</li>
    </ul>

    <h2>4. How information is shared</h2>

    <h3>Other users</h3>
    <p>
      Your public profile details, photos, verification badge, city or approximate location, and
      content you send to another user may be visible to other users. Private messages are shared
      with their recipients.
    </p>

    <h3>Service providers</h3>
    <table>
      <thead>
        <tr>
          <th>Provider</th>
          <th>Purpose</th>
          <th>Data involved</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Amazon Web Services</td>
          <td>Hosting, database, photo storage, face comparison</td>
          <td>Account data, photos, verification selfie/result</td>
        </tr>
        <tr>
          <td>Google Firebase</td>
          <td>Phone auth and push notifications</td>
          <td>Auth identifiers, device/push token</td>
        </tr>
        <tr>
          <td>Google Play</td>
          <td>Subscriptions and coin purchases</td>
          <td>Order, product, token, amount, status</td>
        </tr>
        <tr>
          <td>Google, Facebook, or Apple</td>
          <td>Social sign-in (when you choose it)</td>
          <td>Name, email, profile details, account ID</td>
        </tr>
      </tbody>
    </table>

    <h3>Legal and safety</h3>
    <p>
      We may disclose information to comply with law, protect users and SugarBF, investigate fraud
      or abuse, or in connection with a merger, financing, or sale of assets, subject to
      appropriate safeguards.
    </p>

    <h2>5. Profile visibility</h2>
    <p>
      Information you put on your profile may be viewed or shared by other users. You can hide
      your profile in Account Settings; existing matches and messages remain available. Blocking
      limits future interaction but cannot remove copies another user already saved outside the app.
    </p>

    <h2>6. Data retention</h2>
    <ul>
      <li>messages are generally deleted after 90 days;</li>
      <li>when you delete your account, the profile is disabled and identifying details are anonymized;</li>
      <li>profile photos are removed when deletion is requested;</li>
      <li>the remaining account record is generally permanently purged after about 30 days; and</li>
      <li>purchase, fraud-prevention, ban, security, backup, or legal records may be kept longer where required or reasonably necessary.</li>
    </ul>

    <h2>7. Your rights and choices</h2>
    <p>Depending on where you live, you may request access, correction, deletion, restriction, objection, or portability. You can also:</p>
    <ul>
      <li>edit profile and photos in the app;</li>
      <li>hide your profile, block users, or delete your account in settings;</li>
      <li>revoke location, camera, photo, and notification permissions in device settings; and</li>
      <li>manage or cancel subscriptions in Google Play.</li>
    </ul>
    <p>
      Privacy requests: email
      <a href="mailto:support@sugarbf.club">support@sugarbf.club</a>
      from your account email/phone context. We may verify your identity before acting.
    </p>

    <h2>8. Security</h2>
    <p>
      We use reasonable technical and organizational safeguards, including encrypted connections,
      access controls, and secure cloud infrastructure. No system is fully secure. Keep your
      device and login secure, and report suspected unauthorized access promptly.
    </p>

    <h2>9. International transfers</h2>
    <p>
      SugarBF and its providers may process information in India and other countries. Those
      countries may have different privacy laws. Where required, we use appropriate transfer
      safeguards.
    </p>

    <h2>10. Children’s privacy</h2>
    <p>
      The Services are not directed to anyone under 18. If you believe a minor created an account,
      contact us and we will investigate and delete it as appropriate.
    </p>

    <h2>11. Changes</h2>
    <p>
      We may update this policy as the Services or law change. The updated version will be posted
      at this URL with a revised “Last updated” date. We may also provide in-app notice for
      material changes where required.
    </p>

    <h2>12. Contact</h2>
    <p>
      <strong>SugarBF Privacy Team</strong><br />
      Email: <a href="mailto:support@sugarbf.club">support@sugarbf.club</a><br />
      App / site: <a href="https://sugarbf.club">https://sugarbf.club</a>
    </p>

    <footer>© 2026 SugarBF. All rights reserved.</footer>
  </div>
</body>
</html>`;

import { renderLegalPage } from './legal-page.layout';

const APP_NAME = 'NRI Friends';
const SUPPORT_EMAIL = process.env.NRI_FRIENDS_SUPPORT_EMAIL || 'support@sugarbf.club';
const SITE_URL = process.env.NRI_FRIENDS_SITE_URL || 'https://nrifriends.sugarbf.club';

export const NRI_FRIENDS_PRIVACY_HTML = renderLegalPage({
  title: `Privacy Policy | ${APP_NAME}`,
  description: `${APP_NAME} Privacy Policy`,
  brandHtml: 'NRI <span>Friends</span>',
  brandUrl: SITE_URL,
  accent: '#4fd1c5',
  accentSoft: 'rgba(79, 209, 197, 0.25)',
  heading: '#b2f5ea',
  background: 'linear-gradient(145deg, #062a33 0%, #0d0d0d 50%)',
  footer: `© 2026 ${APP_NAME}. All rights reserved.`,
  body: `
    <h1>Privacy Policy</h1>
    <p class="meta"><strong>Effective date:</strong> 1 October 2026 &nbsp;·&nbsp; <strong>Last updated:</strong> 1 October 2026</p>

    <div class="notice">
      <strong>Adults only, friendship only.</strong> ${APP_NAME} helps Non-Resident Indians (NRIs),
      Persons of Indian Origin, and Indian students and professionals abroad find friends, flatmates,
      and community near them. It is not a dating service. You must be at least 18 years old.
    </div>

    <p>
      This Privacy Policy explains how ${APP_NAME} (“${APP_NAME},” “we,” “us,” or “our”) collects,
      uses, shares, stores, and protects information when you use the ${APP_NAME} mobile
      application, website, and related services (the “Services”).
    </p>

    <h2>1. Information we collect</h2>

    <h3>Account and identity</h3>
    <p>
      Phone number, email address, name, and, if you choose social sign-in, identifiers and basic
      profile details from Google, Facebook, or Apple. Phone numbers are verified by OTP through
      Firebase Authentication.
    </p>

    <h3>Profile</h3>
    <p>You may provide:</p>
    <ul>
      <li>name, age, gender, and profile photos;</li>
      <li>current country and city, and your hometown or home state in India;</li>
      <li>languages you speak (for example Hindi, Tamil, Telugu, Punjabi, Gujarati, Malayalam, Bengali);</li>
      <li>whether you are a student, working professional, or new arrival, plus university or industry if you choose;</li>
      <li>interests and hobbies (cricket, food, festivals, music, travel, etc.);</li>
      <li>what you are looking for, such as friends, flatmates, travel buddies, or local events; and</li>
      <li>a short bio.</li>
    </ul>
    <p>
      Religion, caste, and similar details are not required. Please do not add them to your bio
      unless you are comfortable making them public.
    </p>

    <h3>Photos and verification</h3>
    <p>
      Profile photos are stored securely. If you choose to verify your profile, we collect a selfie
      and compare it with your profile photo using automated face comparison (Amazon Rekognition),
      and we store only the verification result.
    </p>

    <h3>Location</h3>
    <p>
      With your permission, we collect approximate or precise foreground location to show people,
      groups, and events near you. Background location is not required. Your exact location is
      never shown to other users; we show only distance or city.
    </p>

    <h3>Communications and activity</h3>
    <p>
      Friend requests, connections, messages, group chats, event RSVPs, blocks, and reports, with
      related timestamps. Messages are not end-to-end encrypted.
    </p>

    <h3>Purchases</h3>
    <p>
      Optional premium features are processed by Google Play or the Apple App Store. We do not
      receive full card details. We receive product ID, purchase token, order ID, amount, currency,
      and subscription status.
    </p>

    <h3>Device and technical data</h3>
    <p>
      Device model, platform, app version, push token, IP address, time zone, request logs, and
      security and error information.
    </p>

    <h2>2. How we use information</h2>
    <ul>
      <li>create and secure accounts;</li>
      <li>suggest friends based on city, hometown, language, interests, and what you are looking for;</li>
      <li>show nearby groups, meetups, and community events;</li>
      <li>enable friend requests, messaging, and group chats;</li>
      <li>verify profiles and prevent fake accounts, spam, and scams;</li>
      <li>process premium purchases;</li>
      <li>send service, safety, and activity notifications;</li>
      <li>investigate reports and enforce our community rules; and</li>
      <li>comply with legal obligations.</li>
    </ul>
    <p>
      We do not sell your personal information and do not use your messages for advertising.
    </p>

    <h2>3. Legal bases</h2>
    <ul>
      <li><strong>Contract</strong> — to provide the Services;</li>
      <li><strong>Consent</strong> — for location, notifications, photos, and verification;</li>
      <li><strong>Legitimate interests</strong> — to keep the community safe and improve the Services; and</li>
      <li><strong>Legal obligations</strong> — to comply with applicable law.</li>
    </ul>

    <h2>4. How information is shared</h2>

    <h3>Other users</h3>
    <p>
      Your profile, photos, city, hometown, languages, interests, and verification badge are visible
      to other users. Messages are visible to their recipients, and group messages to group members.
      Your phone number and email are never shown to other users.
    </p>

    <h3>Service providers</h3>
    <table>
      <thead>
        <tr><th>Provider</th><th>Purpose</th><th>Data involved</th></tr>
      </thead>
      <tbody>
        <tr><td>Amazon Web Services</td><td>Hosting, database, photo storage, face comparison</td><td>Account and profile data, photos, verification result</td></tr>
        <tr><td>Google Firebase</td><td>Phone OTP and push notifications</td><td>Phone number, device/push token</td></tr>
        <tr><td>Google Play / Apple App Store</td><td>Premium purchases</td><td>Order, product, token, amount, status</td></tr>
        <tr><td>Google, Facebook, Apple</td><td>Social sign-in (if you choose it)</td><td>Name, email, account ID</td></tr>
      </tbody>
    </table>

    <h3>Legal and safety</h3>
    <p>
      We may disclose information to comply with law, respond to lawful requests, protect users from
      harm or fraud, or in connection with a merger or sale of assets, subject to appropriate
      safeguards.
    </p>

    <h2>5. Your privacy controls</h2>
    <ul>
      <li>hide your profile or show it only to people in your city;</li>
      <li>block or report users;</li>
      <li>leave groups at any time;</li>
      <li>turn off location, camera, photos, and notifications in device settings; and</li>
      <li>delete your account in the app settings.</li>
    </ul>

    <h2>6. Data retention</h2>
    <ul>
      <li>profiles are kept while your account is open;</li>
      <li>when you delete your account, your profile is hidden immediately and photos are deleted;</li>
      <li>remaining account data is permanently deleted after about 30 days;</li>
      <li>messages are generally deleted after 90 days; and</li>
      <li>payment, fraud-prevention, ban, and legal records may be kept longer where required.</li>
    </ul>

    <h2>7. Your rights</h2>
    <p>
      Depending on where you live (for example India, the EU/UK, the US, Canada, Australia, or the
      Gulf countries), you may have the right to access, correct, delete, or port your data and to
      withdraw consent. Email <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> to make a
      request. We may verify your identity first. You may also complain to your local data
      protection authority.
    </p>

    <h2>8. Safety and security</h2>
    <p>
      We use encrypted connections, access controls, and secure cloud infrastructure. No system is
      fully secure. Meet new people in public places, never share passwords or bank details, and
      report anyone asking for money, visa or job “help,” or personal documents.
    </p>

    <h2>9. International transfers</h2>
    <p>
      Your information may be processed in India and other countries where our providers operate,
      and your profile may be seen by users in other countries. Where required, we use appropriate
      safeguards for cross-border transfers.
    </p>

    <h2>10. Children</h2>
    <p>
      The Services are not directed to anyone under 18. If you believe a minor has an account,
      contact us and we will remove it.
    </p>

    <h2>11. Changes</h2>
    <p>
      We may update this policy. The latest version will be posted at this URL with a revised
      “Last updated” date, and we will notify you in the app of material changes where required.
    </p>

    <h2>12. Contact and Grievance Officer</h2>
    <p>
      <strong>${APP_NAME} Privacy Team</strong><br />
      Email: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a><br />
      Website: <a href="${SITE_URL}">${SITE_URL}</a>
    </p>
    <p>
      For users in India, grievances under the Information Technology Act, 2000 and the Digital
      Personal Data Protection Act, 2023 can be sent to the Grievance Officer at the email above.
      We aim to respond within 30 days.
    </p>`,
});

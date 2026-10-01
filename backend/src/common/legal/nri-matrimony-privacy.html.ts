import { renderLegalPage } from './legal-page.layout';

const APP_NAME = 'NRI Matrimony';
const SUPPORT_EMAIL = process.env.NRI_MATRIMONY_SUPPORT_EMAIL || 'support@sugarbf.club';
const SITE_URL = process.env.NRI_MATRIMONY_SITE_URL || 'https://nri-api.sugarbf.club';

export const NRI_MATRIMONY_PRIVACY_HTML = renderLegalPage({
  title: `Privacy Policy | ${APP_NAME}`,
  description: `${APP_NAME} Privacy Policy`,
  brandHtml: 'NRI <span>Matrimony</span>',
  brandUrl: SITE_URL,
  accent: '#f4b942',
  accentSoft: 'rgba(244, 185, 66, 0.25)',
  heading: '#ffe0a3',
  background: 'linear-gradient(145deg, #3a0a0a 0%, #0d0d0d 50%)',
  footer: `© 2026 ${APP_NAME}. All rights reserved.`,
  body: `
    <h1>Privacy Policy</h1>
    <p class="meta"><strong>Effective date:</strong> 1 October 2026 &nbsp;·&nbsp; <strong>Last updated:</strong> 1 October 2026</p>

    <div class="notice">
      <strong>For marriage-minded adults only.</strong> ${APP_NAME} is a matchmaking service for
      Non-Resident Indians (NRIs), Persons of Indian Origin (PIOs), and people seeking an NRI life
      partner. You must be at least 18 years old and of legal marriageable age in your country of
      residence (in India: 21 for men, 18 for women) to create a profile.
    </div>

    <p>
      This Privacy Policy explains how ${APP_NAME} (“${APP_NAME},” “we,” “us,” or “our”) collects,
      uses, shares, stores, and protects information when you use the ${APP_NAME} mobile
      application, website, and related services (the “Services”). Because matrimonial profiles
      often include personal and family details, please read this policy carefully.
    </p>

    <h2>1. Information we collect</h2>

    <h3>Account and identity</h3>
    <p>
      Phone number, email address, name, and, if you choose social sign-in, identifiers and basic
      profile details from Google, Facebook, or Apple. We use Firebase Authentication to verify
      phone numbers by OTP.
    </p>

    <h3>Who manages the profile</h3>
    <p>
      Profiles may be created by the prospective bride or groom, or by a parent, sibling, relative,
      or friend on their behalf. If you create a profile for someone else, you confirm that you have
      their permission and that they are of legal marriageable age.
    </p>

    <h3>Matrimonial profile details</h3>
    <p>You may provide:</p>
    <ul>
      <li>date of birth, age, gender, height, marital status (never married, divorced, widowed, awaiting divorce), and whether you have children;</li>
      <li>religion, community, caste or sub-caste, gotra, mother tongue, and languages spoken;</li>
      <li>education, profession, employer, and annual income range;</li>
      <li>family details such as family type, values, parents’ occupations, and siblings;</li>
      <li>diet, smoking and drinking habits, and lifestyle preferences;</li>
      <li>horoscope details such as time and place of birth, rashi, nakshatra, and manglik status;</li>
      <li>partner preferences; and</li>
      <li>a bio and any other details you choose to add.</li>
    </ul>

    <h3>NRI and residency details</h3>
    <p>
      Current country and city of residence, hometown or native place in India, citizenship,
      residency or visa status (for example citizen, permanent resident, work visa, student visa),
      and willingness to relocate. These help match people across countries.
    </p>

    <h3>Sensitive information</h3>
    <p>
      Religion, caste or community, horoscope details, and health or disability information (if
      you choose to share it) may be considered sensitive personal data under laws such as India’s
      Digital Personal Data Protection Act, 2023 and the EU/UK GDPR. These fields are optional. We
      process them only with your consent and only to show your profile to and match you with
      compatible members. You can edit or remove them at any time.
    </p>

    <h3>Photos and verification</h3>
    <p>
      Profile photos you upload are stored securely. If you choose to verify your profile, we may
      collect a selfie and compare it with your profile photo using automated face comparison
      (Amazon Rekognition), and we store the verification result. If we offer ID verification and
      you choose it, we collect the document image only to confirm identity and age, and we do not
      show it to other members.
    </p>

    <h3>Location</h3>
    <p>
      With your permission, we collect approximate or precise foreground location to suggest
      matches nearby or in your country. Background location is not required. You can disable
      location in device settings.
    </p>

    <h3>Communications and activity</h3>
    <p>
      Interests sent and received, shortlists, profile views, accepted or declined requests,
      messages, contact-detail requests, blocks, and reports, with related timestamps. Messages are
      not end-to-end encrypted.
    </p>

    <h3>Purchases</h3>
    <p>
      Premium memberships are processed by Google Play or the Apple App Store. We do not receive
      full card details. We receive product ID, purchase token, order ID, amount, currency, and
      subscription status so we can unlock paid features.
    </p>

    <h3>Device and technical data</h3>
    <p>
      Device model, platform, app version, push token, IP address, time zone, request logs, and
      security and error information.
    </p>

    <h2>2. How we use information</h2>
    <ul>
      <li>create and secure accounts and verify phone numbers;</li>
      <li>show your profile to members who match your and their preferences;</li>
      <li>recommend matches based on community, location, residency, and partner preferences;</li>
      <li>enable interests, messaging, and contact sharing between members;</li>
      <li>verify profiles and help prevent fake profiles, fraud, and marriage scams;</li>
      <li>process memberships and unlock premium features;</li>
      <li>send match alerts, service, and security notifications;</li>
      <li>investigate reports and enforce our rules; and</li>
      <li>comply with legal obligations.</li>
    </ul>
    <p>
      We do not sell your personal information. We do not share your phone number or email with
      other members unless you choose to share or accept a contact request.
    </p>

    <h2>3. Legal bases</h2>
    <ul>
      <li><strong>Contract</strong> — to provide the matchmaking Services and memberships;</li>
      <li><strong>Consent</strong> — for sensitive profile details, horoscope, location, notifications, and verification;</li>
      <li><strong>Legitimate interests</strong> — to keep the platform safe and prevent fraud; and</li>
      <li><strong>Legal obligations</strong> — to comply with applicable law and lawful requests.</li>
    </ul>

    <h2>4. How information is shared</h2>

    <h3>Other members</h3>
    <p>
      Your profile, photos, and matrimonial details are visible to other members according to your
      privacy settings. You can choose to show photos only to members you accept, and hide your
      contact details until you approve a request. Family members who manage a profile with you can
      see the same information you can.
    </p>

    <h3>Service providers</h3>
    <table>
      <thead>
        <tr><th>Provider</th><th>Purpose</th><th>Data involved</th></tr>
      </thead>
      <tbody>
        <tr><td>Amazon Web Services</td><td>Hosting, database, photo storage, face comparison</td><td>Account and profile data, photos, verification result</td></tr>
        <tr><td>Google Firebase</td><td>Phone OTP and push notifications</td><td>Phone number, device/push token</td></tr>
        <tr><td>Google Play / Apple App Store</td><td>Membership payments</td><td>Order, product, token, amount, status</td></tr>
        <tr><td>Google, Facebook, Apple</td><td>Social sign-in (if you choose it)</td><td>Name, email, account ID</td></tr>
      </tbody>
    </table>

    <h3>Legal and safety</h3>
    <p>
      We may disclose information to comply with law, respond to lawful requests from authorities
      in India or your country of residence, protect members from fraud or harm, or in connection
      with a merger or sale of assets, subject to appropriate safeguards.
    </p>

    <h2>5. Your privacy controls</h2>
    <ul>
      <li>choose who can see your photos and contact details;</li>
      <li>hide your profile temporarily (for example after you find a match);</li>
      <li>block or report members;</li>
      <li>edit or remove optional and sensitive fields; and</li>
      <li>delete your account in the app settings.</li>
    </ul>

    <h2>6. Data retention</h2>
    <ul>
      <li>active profiles are kept while your account is open;</li>
      <li>when you delete your account, your profile is removed from search immediately and photos are deleted;</li>
      <li>remaining account data is permanently deleted after about 30 days;</li>
      <li>messages are generally deleted after 90 days of inactivity; and</li>
      <li>payment, fraud-prevention, ban, and legal records may be kept longer where required.</li>
    </ul>

    <h2>7. Your rights</h2>
    <p>
      Depending on where you live (for example India, the EU/UK, the US, Canada, Australia, or the
      Gulf countries), you may have the right to access, correct, delete, restrict, or port your
      data, withdraw consent, and nominate someone to exercise your rights. To make a request,
      email <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>. We may verify your identity
      first. You may also complain to your local data protection authority.
    </p>

    <h2>8. Security</h2>
    <p>
      We use encrypted connections, access controls, and secure cloud infrastructure. No system is
      fully secure. Never send money to someone you met on ${APP_NAME}, and report anyone who asks
      for money, visa help, or financial details.
    </p>

    <h2>9. International transfers</h2>
    <p>
      Because ${APP_NAME} connects people across countries, your information may be processed in
      India and other countries where our providers operate, and your profile may be viewed by
      members abroad. Where required, we use appropriate safeguards for cross-border transfers.
    </p>

    <h2>10. Children</h2>
    <p>
      The Services are not for anyone under 18 or under the legal marriageable age. If you believe a
      minor’s profile exists, contact us and we will remove it.
    </p>

    <h2>11. Changes</h2>
    <p>
      We may update this policy. The latest version will always be posted at this URL with a revised
      “Last updated” date, and we will notify you in the app of material changes where required.
    </p>

    <h2>12. Contact and Grievance Officer</h2>
    <p>
      <strong>${APP_NAME} Privacy Team</strong><br />
      Email: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a><br />
      Website: <a href="${SITE_URL}">${SITE_URL}</a>
    </p>
    <p>
      For members in India, grievances under the Information Technology Act, 2000 and the Digital
      Personal Data Protection Act, 2023 can be sent to the Grievance Officer at the email above.
      We aim to respond within 30 days.
    </p>`,
});

# Goodly — Privacy Policy

**Last updated: June 2026**

## 1. Information We Collect

### Information You Provide
- **Account information:** Email address, name, password (hashed)
- **Business information:** Website URLs, business names, categories, locations, social media handles
- **Payment information:** Processed securely by Stripe — we never store full credit card numbers
- **Concierge brief:** Business details, goals, target keywords, competitors

### Information Collected Automatically
- **Usage data:** Pages visited, features used, audit history
- **Technical data:** Browser type, device information, IP address
- **Cookies:** Essential authentication cookies only (JWT in HttpOnly cookie)

## 2. How We Use Your Information

We use your information to:
- Provide, maintain, and improve the Service
- Process payments and manage subscriptions
- Send audit digests and product updates (with opt-out)
- Respond to support requests and inquiries
- Detect and prevent fraud and abuse
- Comply with legal obligations

We do **not** sell your personal information to third parties.

## 3. AI Processing

Some features use Google Gemini to generate recommendations. When you use AI features:
- Your inputs (business names, descriptions, URLs) are sent to Google's API for processing
- Google does not use customer data to train its models
- See [Google's AI Privacy Policy](https://ai.google.dev/privacy) for details

## 4. Data Storage and Security

- **Storage:** Data is stored on MongoDB Atlas with encryption at rest
- **Transmission:** All data is transmitted over HTTPS/TLS
- **Authentication:** JWT tokens in HttpOnly, Secure cookies
- **Access control:** User-scoped queries — users can only access their own data
- **Rate limiting:** Prevents brute-force and abuse attacks

While we implement industry-standard security measures, no method of electronic storage or transmission is 100% secure.

## 5. Cookies

We use a single essential cookie for authentication:
- **access_token:** JWT token, HttpOnly, Secure (in production), SameSite=Lax, 7-day expiry

We do not use tracking cookies, advertising cookies, or third-party analytics cookies.

## 6. Third-Party Services

| Service | Purpose | Data Shared |
|---------|---------|-------------|
| Google Gemini | AI recommendations | Business names, descriptions, URLs |
| Stripe | Payment processing | Email, payment method |
| Resend | Email delivery | Email address, name |
| MongoDB Atlas | Data storage | All application data |

Each service has its own privacy policy. We encourage you to review them.

## 7. Data Retention

- **Account data:** Retained while your account is active
- **Audit data:** Retained while your account is active
- **Deleted accounts:** Data is permanently deleted within 30 days of account deletion
- **Payment records:** Retained for 7 years for tax and compliance purposes

## 8. Your Rights

You have the right to:
- **Access:** Request a copy of your personal data
- **Correction:** Update inaccurate information
- **Deletion:** Request deletion of your account and data
- **Export:** Download your audit data from the dashboard
- **Opt-out:** Unsubscribe from marketing emails

To exercise these rights, contact us at **privacy@goodly.app**.

## 9. Children's Privacy

The Service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.

## 10. International Data Transfers

Your data is stored in the United States. By using the Service, you consent to the transfer of your data to the United States.

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify users of material changes via email or through the Service.

## 12. Contact

For privacy-related inquiries:
- **Email:** privacy@goodly.app
- **Address:** Goodly, Inc., Delaware, United States

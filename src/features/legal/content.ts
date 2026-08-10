export const LEGAL_LAST_UPDATED = "June 12, 2026";
export const SUPPORT_EMAIL = "support@clutchodds.com";

export type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export type LegalSection = {
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocumentContent = {
  title: string;
  sections: LegalSection[];
};

export const TERMS_OF_SERVICE: LegalDocumentContent = {
  title: "Terms of Service",
  sections: [
    {
      title: "1. Agreement",
      blocks: [
        {
          type: "paragraph",
          text: 'These Terms of Service ("Terms") govern your access to and use of Clutch Odds ("Clutch Odds," "we," "us," or "our"), including our website, applications, and related services (collectively, the "Service"). By creating an account or using the Service, you agree to these Terms.',
        },
        {
          type: "paragraph",
          text: "If you do not agree, do not use the Service. You must be at least 18 years old (or the legal age in your jurisdiction) and legally permitted to access sports-betting-related tools where you live.",
        },
      ],
    },
    {
      title: "2. What Clutch Odds is — and is not",
      blocks: [
        {
          type: "paragraph",
          text: "Clutch Odds is a private research and execution-support tool that aggregates and displays sportsbook odds to help you identify theoretical arbitrage, shop moneyline edges in Edge Center (+EV), and track your own betting activity.",
        },
        {
          type: "paragraph",
          text: "We do not place bets on your behalf, operate as a sportsbook, provide financial or investment advice, or guarantee profit. Odds change quickly; limits, voids, and human error can eliminate an edge before you finish placing legs.",
        },
        {
          type: "paragraph",
          text: "You are solely responsible for compliance with laws, sportsbook rules, tax obligations, and responsible-gambling requirements in your jurisdiction.",
        },
      ],
    },
    {
      title: "3. Accounts",
      blocks: [
        {
          type: "paragraph",
          text: `You must provide accurate registration information and keep your credentials secure. You are responsible for activity under your account. Notify us promptly at ${SUPPORT_EMAIL} if you suspect unauthorized access.`,
        },
        {
          type: "paragraph",
          text: "We may suspend or terminate accounts that violate these Terms, abuse the Service, or create risk for us or other users.",
        },
      ],
    },
    {
      title: "4. Subscriptions and billing",
      blocks: [
        {
          type: "paragraph",
          text: "Paid features require an active Pro subscription billed through Stripe. New subscribers may receive a free trial period with full Pro access; a valid payment method is required at checkout. Unless you cancel before the trial ends, your subscription converts to a paid plan and renews automatically until canceled through the billing portal in Settings or via Stripe. Prices, trial length, billing intervals, and included features are shown at checkout and on our pricing page.",
        },
        {
          type: "paragraph",
          text: "Except where required by law, fees are non-refundable once a billing period has started. We may change pricing with reasonable notice; changes apply to subsequent billing periods.",
        },
      ],
    },
    {
      title: "5. Acceptable use",
      blocks: [
        { type: "paragraph", text: "You agree not to:" },
        {
          type: "list",
          items: [
            "Scrape, reverse engineer, or overload the Service without permission",
            "Share account access or resell the Service",
            "Use the Service for unlawful purposes or to circumvent sportsbook terms",
            "Upload malware or attempt to access systems without authorization",
          ],
        },
      ],
    },
    {
      title: "6. Third-party services",
      blocks: [
        {
          type: "paragraph",
          text: "The Service relies on third parties (for example, odds data providers, payment processors, cloud hosts, and optional Google sign-in). Your use of those services may be subject to their separate terms. We are not responsible for third-party outages, data delays, or policy changes.",
        },
      ],
    },
    {
      title: "6. Telegram alerts (Pro)",
      blocks: [
        {
          type: "paragraph",
          text: "Pro subscribers may optionally join our Telegram channel for arbitrage alerts. Joining is voluntary; we do not read your Telegram messages. Alerts cover arbitrage opportunities only — not Edge Center.",
        },
      ],
    },
    {
      title: "7. Disclaimers",
      blocks: [
        {
          type: "paragraph",
          text: 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT ODDS, ALERTS, OR ANALYTICS ARE ACCURATE, COMPLETE, OR TIMELY.',
        },
      ],
    },
    {
      title: "8. Limitation of liability",
      blocks: [
        {
          type: "paragraph",
          text: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLUTCH ODDS AND ITS OPERATORS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE IS LIMITED TO THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS BEFORE THE CLAIM, OR ONE HUNDRED US DOLLARS ($100), WHICHEVER IS GREATER.",
        },
      ],
    },
    {
      title: "9. Changes",
      blocks: [
        {
          type: "paragraph",
          text: 'We may update these Terms from time to time. We will post the revised version on this page and update the "Last updated" date. Continued use after changes become effective constitutes acceptance of the revised Terms.',
        },
      ],
    },
    {
      title: "10. Contact",
      blocks: [
        {
          type: "paragraph",
          text: `For questions about these Terms, email ${SUPPORT_EMAIL}.`,
        },
      ],
    },
  ],
};

export const PRIVACY_POLICY: LegalDocumentContent = {
  title: "Privacy Policy",
  sections: [
    {
      title: "1. Overview",
      blocks: [
        {
          type: "paragraph",
          text: 'This Privacy Policy explains how Clutch Odds ("we," "us," or "our") collects, uses, and shares information when you use our website and services (the "Service"). By using the Service, you agree to the practices described here.',
        },
      ],
    },
    {
      title: "2. Information we collect",
      blocks: [
        {
          type: "paragraph",
          text: "Account information. When you register, we collect your name, email address, and password (stored as a secure hash). If you use Google sign-in, we receive profile information from Google according to your Google account settings.",
        },
        {
          type: "paragraph",
          text: "Usage and betting data. If you use Pro features, we store data you enter or generate in the Service, such as manual bet logs (from arbitrage or Edge Center), dashboard analytics, and sportsbook or sport filter preferences stored in your browser or account.",
        },
        {
          type: "paragraph",
          text: "Payment information. Subscriptions are processed by Stripe. We receive subscription status, customer IDs, and billing metadata from Stripe — not your full card number.",
        },
        {
          type: "paragraph",
          text: "Technical data. We automatically collect standard server logs (IP address, browser type, pages visited, timestamps) needed to operate and secure the Service.",
        },
      ],
    },
    {
      title: "3. How we use information",
      blocks: [
        { type: "paragraph", text: "We use information to:" },
        {
          type: "list",
          items: [
            "Provide, maintain, and improve the Service",
            "Authenticate users and enforce subscription access",
            "Process payments and send billing-related communications",
            "Respond to support requests and protect against abuse or fraud",
            "Comply with legal obligations",
          ],
        },
      ],
    },
    {
      title: "4. How we share information",
      blocks: [
        {
          type: "paragraph",
          text: "We do not sell your personal information. We share data only with service providers that help us run the Service, such as:",
        },
        {
          type: "list",
          items: [
            "Hosting and database providers (for example, Neon)",
            "Payment processing (Stripe)",
            "Authentication (Google, if you choose Google sign-in)",
            "Odds data providers (aggregated odds requests; not your identity)",
            "Optional Telegram channel alerts for Pro subscribers (if you join the channel)",
          ],
        },
        {
          type: "paragraph",
          text: "We may also disclose information if required by law or to protect our rights, users, or the public.",
        },
      ],
    },
    {
      title: "5. Cookies and local storage",
      blocks: [
        {
          type: "paragraph",
          text: "We use essential cookies for session authentication (for example, a secure httpOnly session cookie when you log in). We may use browser local storage for UI preferences such as sportsbook filters. We do not use third-party advertising cookies.",
        },
      ],
    },
    {
      title: "6. Data retention",
      blocks: [
        {
          type: "paragraph",
          text: "We retain account and subscription data while your account is active and as needed to provide the Service, comply with law, and resolve disputes. You may request account deletion by contacting us; some data may be retained where required by law or legitimate business needs (for example, billing records).",
        },
      ],
    },
    {
      title: "7. Security",
      blocks: [
        {
          type: "paragraph",
          text: "We use industry-standard measures such as encrypted connections (HTTPS), hashed passwords, and access controls. No method of transmission or storage is 100% secure; we cannot guarantee absolute security.",
        },
      ],
    },
    {
      title: "8. Your choices and rights",
      blocks: [
        {
          type: "paragraph",
          text: `Depending on where you live, you may have rights to access, correct, delete, or export personal data, or to object to certain processing. Contact us at ${SUPPORT_EMAIL} to make a request. We may need to verify your identity before responding.`,
        },
      ],
    },
    {
      title: "9. International users",
      blocks: [
        {
          type: "paragraph",
          text: "The Service is operated from the United States. If you access the Service from other regions, your information may be processed in the U.S. or where our providers operate.",
        },
      ],
    },
    {
      title: "10. Children",
      blocks: [
        {
          type: "paragraph",
          text: "The Service is not directed to anyone under 18. We do not knowingly collect personal information from children. Contact us if you believe a child has provided us data.",
        },
      ],
    },
    {
      title: "11. Changes",
      blocks: [
        {
          type: "paragraph",
          text: 'We may update this Privacy Policy from time to time. We will post the revised policy on this page and update the "Last updated" date.',
        },
      ],
    },
    {
      title: "12. Contact",
      blocks: [
        {
          type: "paragraph",
          text: `Privacy questions or requests: ${SUPPORT_EMAIL}.`,
        },
      ],
    },
  ],
};

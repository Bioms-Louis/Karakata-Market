const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Privacy Policy
          </h1>

          <p className="text-gray-500 text-sm">
            Last updated: {new Date().getFullYear()}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">

          {/* Intro */}
          <section>
            <p>
              Karakata Market (“Karakata”, “we”, “our”, or “us”) respects your
              privacy and is committed to protecting your personal data.
              This Privacy Policy explains how we collect, use, store, and
              protect your information when you use our platform.
            </p>

            <p className="mt-3">
              By using Karakata Market, you agree to the collection and use
              of information in accordance with this policy.
            </p>
          </section>

          {/* Information Collected */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              1. Information We Collect
            </h2>

            <p>We may collect the following types of information:</p>

            <ul className="list-disc pl-6 mt-3 space-y-1 text-sm">
              <li>Name and contact information</li>
              <li>Email address and phone number</li>
              <li>Shipping and billing address</li>
              <li>Account login details</li>
              <li>Order history and transaction data</li>
              <li>Device and browser information</li>
            </ul>
          </section>

          {/* How Info Used */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              2. How We Use Your Information
            </h2>

            <p>Your information helps us:</p>

            <ul className="list-disc pl-6 mt-3 space-y-1 text-sm">
              <li>Process orders and payments</li>
              <li>Deliver products through vendors and logistics partners</li>
              <li>Provide customer support</li>
              <li>Improve the platform and user experience</li>
              <li>Send order updates and service notifications</li>
              <li>Prevent fraud and maintain platform security</li>
            </ul>
          </section>

          {/* Vendor Data */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              3. Information Shared with Vendors
            </h2>

            <p>
              When you place an order on Karakata Market, your delivery
              information may be shared with the vendor responsible for
              fulfilling your order.
            </p>

            <p className="mt-2">
              Vendors only receive the information necessary to process and
              deliver your order.
            </p>
          </section>

          {/* Payments */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              4. Payment Information
            </h2>

            <p>
              Payments on Karakata Market are processed through secure
              third-party payment providers. We do not store sensitive
              financial details such as debit or credit card numbers.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              5. Cookies and Tracking Technologies
            </h2>

            <p>
              Karakata Market uses cookies and similar technologies to:
            </p>

            <ul className="list-disc pl-6 mt-3 space-y-1 text-sm">
              <li>Keep users logged in</li>
              <li>Improve site performance</li>
              <li>Analyze user behavior</li>
              <li>Personalize the shopping experience</li>
            </ul>

            <p className="mt-2">
              You can disable cookies through your browser settings,
              although some platform features may not function properly.
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              6. Data Security
            </h2>

            <p>
              We implement appropriate technical and organizational measures
              to protect your personal information from unauthorized access,
              loss, misuse, or disclosure.
            </p>

            <p className="mt-2">
              However, no online system is completely secure, and we cannot
              guarantee absolute security of your data.
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              7. Your Privacy Rights
            </h2>

            <p>You have the right to:</p>

            <ul className="list-disc pl-6 mt-3 space-y-1 text-sm">
              <li>Access your personal data</li>
              <li>Update or correct your information</li>
              <li>Request deletion of your account</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          {/* Policy Updates */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              8. Changes to This Policy
            </h2>

            <p>
              Karakata Market may update this Privacy Policy periodically
              to reflect changes in our services, technology, or legal
              requirements.
            </p>

            <p className="mt-2">
              Updated policies will be posted on this page with a revised
              “Last Updated” date.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              9. Contact Us
            </h2>

            <p>If you have any questions about this Privacy Policy:</p>

            <div className="mt-3 text-sm space-y-1">
              <p>Email: contact@karakata.market</p>
              <p>Phone: +234 802 688 8555</p>
              <p>
                Address: 2nd floor, Block A, Plot 1699 Sanusi Fafunwa St,
                Victoria Island 106104
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
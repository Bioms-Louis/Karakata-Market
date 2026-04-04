const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Terms & Conditions
          </h1>

          <p className="text-gray-500 text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">

          {/* Introduction */}
          <section>
            <p>
              Welcome to Karakata Market. These Terms & Conditions govern
              your access to and use of the Karakata Market platform,
              including our website and services.
            </p>

            <p className="mt-2">
              By accessing or using Karakata Market, you agree to comply
              with these terms. If you do not agree with any part of
              these terms, please do not use the platform.
            </p>
          </section>

          {/* Platform Description */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              1. About Karakata Market
            </h2>

            <p>
              Karakata Market is an online marketplace that connects
              buyers with independent vendors selling products across
              various categories.
            </p>

            <p className="mt-2">
              Karakata Market does not manufacture products listed on
              the platform and acts as an intermediary between vendors
              and customers.
            </p>
          </section>

          {/* Accounts */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              2. User Accounts
            </h2>

            <p>
              To access certain features of the platform, you may need
              to create an account.
            </p>

            <ul className="list-disc pl-6 mt-3 text-sm space-y-1">
              <li>You must provide accurate information</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must not share your login credentials</li>
              <li>You must be at least 18 years old to create an account</li>
            </ul>
          </section>

          {/* Orders */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              3. Orders & Purchases
            </h2>

            <p>
              When you place an order on Karakata Market, you agree to
              purchase the product at the listed price including
              applicable delivery charges and taxes.
            </p>

            <p className="mt-2">
              Orders may be cancelled if:
            </p>

            <ul className="list-disc pl-6 mt-3 text-sm space-y-1">
              <li>The product is unavailable</li>
              <li>Payment verification fails</li>
              <li>The order violates platform policies</li>
            </ul>
          </section>

          {/* Payments */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              4. Payments
            </h2>

            <p>
              Payments for purchases on Karakata Market must be made
              through approved payment methods provided on the platform.
            </p>

            <p className="mt-2">
              All transactions are processed securely through
              authorized payment partners.
            </p>
          </section>

          {/* Shipping */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              5. Shipping & Delivery
            </h2>

            <p>
              Delivery timelines may vary depending on vendor location,
              shipping partner, and customer address.
            </p>

            <p className="mt-2">
              Estimated delivery times are provided for convenience but
              are not guaranteed.
            </p>
          </section>

          {/* Returns */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              6. Returns & Refunds
            </h2>

            <p>
              Returns and refunds are governed by Karakata Market’s
              Return Policy.
            </p>

            <p className="mt-2">
              Customers must submit return requests within the specified
              timeframe after receiving their order.
            </p>
          </section>

          {/* Vendor Responsibility */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              7. Vendor Responsibility
            </h2>

            <p>
              Vendors are responsible for the products they list,
              including product descriptions, pricing, authenticity,
              and fulfillment of orders.
            </p>

            <p className="mt-2">
              Karakata Market may remove listings that violate
              platform policies.
            </p>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              8. Prohibited Activities
            </h2>

            <p>Users must not:</p>

            <ul className="list-disc pl-6 mt-3 text-sm space-y-1">
              <li>Use the platform for fraudulent purposes</li>
              <li>Upload false or misleading information</li>
              <li>Attempt to hack or disrupt the platform</li>
              <li>Sell illegal or counterfeit products</li>
            </ul>
          </section>

          {/* Suspension */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              9. Account Suspension
            </h2>

            <p>
              Karakata Market reserves the right to suspend or terminate
              accounts that violate these Terms & Conditions.
            </p>
          </section>

          {/* Limitation */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              10. Limitation of Liability
            </h2>

            <p>
              Karakata Market is not liable for damages arising from
              vendor products, delayed deliveries, or third-party
              services used on the platform.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              11. Changes to These Terms
            </h2>

            <p>
              Karakata Market may update these Terms & Conditions
              periodically. Continued use of the platform indicates
              acceptance of the updated terms.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              12. Contact Us
            </h2>

            <p>If you have questions regarding these Terms:</p>

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

export default TermsPage;
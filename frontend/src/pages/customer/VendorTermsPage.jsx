const VendorTermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Vendor Terms & Conditions
          </h1>

          <p className="text-gray-500 text-sm">
            Last updated: {new Date().getFullYear()}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">

          {/* Introduction */}
          <section>
            <p>
              These Vendor Terms & Conditions govern your use of the Karakata
              Market platform as a seller ("Vendor"). By registering as a vendor
              and listing products on Karakata Market, you agree to comply with
              these terms.
            </p>
          </section>

          {/* Vendor Eligibility */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              1. Vendor Eligibility
            </h2>

            <p>
              To sell on Karakata Market, you must:
            </p>

            <ul className="list-disc pl-6 mt-3 text-sm space-y-1">
              <li>Provide accurate business and contact information</li>
              <li>Be legally allowed to sell products in Nigeria</li>
              <li>Have a valid bank account for receiving payouts</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          {/* Product Listings */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              2. Product Listings
            </h2>

            <p>
              Vendors are responsible for ensuring that product listings are
              accurate, truthful, and complete.
            </p>

            <p className="mt-2">
              Listings must include correct descriptions, pricing, images,
              and product availability.
            </p>

            <p className="mt-2">
              Karakata Market reserves the right to remove listings that
              violate our policies.
            </p>
          </section>

          {/* Prohibited Products */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              3. Prohibited Products
            </h2>

            <p>Vendors may not sell the following items:</p>

            <ul className="list-disc pl-6 mt-3 text-sm space-y-1">
              <li>Illegal or counterfeit goods</li>
              <li>Stolen items</li>
              <li>Weapons or dangerous materials</li>
              <li>Fraudulent or misleading products</li>
              <li>Any product prohibited under Nigerian law</li>
            </ul>
          </section>

          {/* Order Fulfillment */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              4. Order Fulfillment
            </h2>

            <p>
              Vendors are responsible for processing and shipping customer
              orders within the specified processing time.
            </p>

            <p className="mt-2">
              Products must be packaged properly to avoid damage during
              shipping.
            </p>

            <p className="mt-2">
              Vendors must provide accurate delivery information and notify
              customers of shipping updates where applicable.
            </p>
          </section>

          {/* Fees & Commission */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              5. Fees & Commission
            </h2>

            <p>
              Karakata Market may charge a commission or service fee on
              completed sales made through the platform.
            </p>

            <p className="mt-2">
              The applicable fees will be communicated to vendors and may
              change periodically.
            </p>
          </section>

          {/* Payments & Payouts */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              6. Payments & Payouts
            </h2>

            <p>
              Vendors will receive payouts for successful orders after
              payment confirmation and fulfillment verification.
            </p>

            <p className="mt-2">
              Payout timelines may vary depending on payment processing
              and platform policies.
            </p>
          </section>

          {/* Returns & Refunds */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              7. Returns & Refunds
            </h2>

            <p>
              Vendors must comply with Karakata Market’s Return Policy
              and cooperate in resolving customer complaints, returns,
              and refund requests.
            </p>
          </section>

          {/* Vendor Conduct */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              8. Vendor Conduct
            </h2>

            <p>Vendors agree not to:</p>

            <ul className="list-disc pl-6 mt-3 text-sm space-y-1">
              <li>Engage in fraudulent activities</li>
              <li>Manipulate reviews or ratings</li>
              <li>Mislead customers about products</li>
              <li>Use the platform for illegal purposes</li>
            </ul>
          </section>

          {/* Suspension */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              9. Account Suspension
            </h2>

            <p>
              Karakata Market reserves the right to suspend or terminate
              vendor accounts that violate these terms or engage in
              activities that harm customers or the platform.
            </p>
          </section>

          {/* Liability */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              10. Limitation of Liability
            </h2>

            <p>
              Karakata Market acts as a marketplace platform connecting
              buyers and vendors. Vendors are solely responsible for
              their products, listings, and fulfillment.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              11. Contact Information
            </h2>

            <p>If you have questions regarding vendor terms:</p>

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

export default VendorTermsPage;
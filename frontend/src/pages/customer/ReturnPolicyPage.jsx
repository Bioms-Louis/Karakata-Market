const ReturnPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Return & Refund Policy
          </h1>

          <p className="text-gray-500 text-sm">
            Last updated: {new Date().getFullYear()}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">

          {/* Intro */}
          <section>
            <p>
              At <strong>Karakata Market</strong>, we strive to ensure a safe
              and trustworthy marketplace for both buyers and vendors.
              Because Karakata is a multi-vendor platform, products are sold
              directly by independent vendors.
            </p>

            <p className="mt-3">
              This Return & Refund Policy explains when and how you can return
              products purchased through our platform.
            </p>
          </section>

          {/* Return Eligibility */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              1. Eligibility for Returns
            </h2>

            <p>Items may be eligible for return if they meet one of the following conditions:</p>

            <ul className="list-disc pl-6 mt-3 space-y-1 text-sm">
              <li>The item delivered is different from what was ordered.</li>
              <li>The product is damaged or defective upon delivery.</li>
              <li>The item is missing essential parts or accessories.</li>
              <li>The vendor sent the wrong size, color, or variant.</li>
            </ul>
          </section>

          {/* Return Window */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              2. Return Window
            </h2>

            <p>
              Customers must request a return within{" "}
              <strong>7 days of delivery</strong>.
            </p>

            <p className="mt-2">
              After this period, the order will be considered accepted and may
              no longer qualify for a refund or replacement.
            </p>
          </section>

          {/* Non Returnable */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              3. Non-Returnable Items
            </h2>

            <p>The following items cannot be returned unless defective:</p>

            <ul className="list-disc pl-6 mt-3 space-y-1 text-sm">
              <li>Perishable goods</li>
              <li>Personal care products</li>
              <li>Underwear or hygiene products</li>
              <li>Digital products or downloads</li>
              <li>Items marked “Non-Returnable” on the product page</li>
            </ul>
          </section>

          {/* Return Process */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              4. How to Request a Return
            </h2>

            <p>To request a return:</p>

            <ol className="list-decimal pl-6 mt-3 space-y-1 text-sm">
              <li>Log in to your Karakata account.</li>
              <li>Go to <strong>My Orders</strong>.</li>
              <li>Select the order you wish to return.</li>
              <li>Click <strong>Request Return</strong>.</li>
              <li>Provide the reason and upload photos if necessary.</li>
            </ol>
          </section>

          {/* Refunds */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              5. Refund Process
            </h2>

            <p>
              Once a return is approved and the item is received by the vendor,
              the refund will be processed within <strong>5–7 business days</strong>.
            </p>

            <p className="mt-2">
              Refunds will be issued to the original payment method used for
              the purchase.
            </p>
          </section>

          {/* Vendor Responsibility */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              6. Vendor Responsibility
            </h2>

            <p>
              Vendors on Karakata Market are responsible for ensuring that
              products are accurately described and properly packaged before
              shipment.
            </p>

            <p className="mt-2">
              Vendors who repeatedly violate return policies may face
              penalties, suspension, or removal from the platform.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              7. Contact Support
            </h2>

            <p>
              If you need help with a return or refund request, please contact
              our support team:
            </p>

            <div className="mt-3 text-sm space-y-1">
              <p>Email: contact@karakata.market</p>
              <p>Phone: +234 802 688 8555</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ReturnPolicyPage;
const ShippingPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Shipping Policy
          </h1>

          <p className="text-gray-500 text-sm">
            Last updated: {new Date().getFullYear()}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 leading-relaxed">

          {/* Intro */}
          <section>
            <p>
              Karakata Market connects buyers with independent vendors across
              Nigeria. Because we are a multi-vendor marketplace, shipping and
              delivery are handled directly by the vendors or their logistics
              partners.
            </p>

            <p className="mt-3">
              This Shipping Policy explains how orders are processed, shipped,
              and delivered when you purchase products on Karakata Market.
            </p>
          </section>

          {/* Processing Time */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              1. Order Processing Time
            </h2>

            <p>
              Vendors typically process orders within <strong>1–2 business days</strong> after payment confirmation.
            </p>

            <p className="mt-2">
              During peak periods, holidays, or sales events, order processing
              may take slightly longer.
            </p>
          </section>

          {/* Delivery Time */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              2. Estimated Delivery Time
            </h2>

            <p>Delivery timelines depend on your location and the vendor’s logistics partner.</p>

            <ul className="list-disc pl-6 mt-3 space-y-1 text-sm">
              <li><strong>Lagos:</strong> 1–3 business days</li>
              <li><strong>Major Cities:</strong> 2–5 business days</li>
              <li><strong>Other Locations:</strong> 3–7 business days</li>
            </ul>

            <p className="mt-3">
              Delivery times are estimates and may vary due to logistics
              delays, weather conditions, or high order volumes.
            </p>
          </section>

          {/* Shipping Fees */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              3. Shipping Fees
            </h2>

            <p>
              Shipping costs are calculated at checkout and depend on:
            </p>

            <ul className="list-disc pl-6 mt-3 space-y-1 text-sm">
              <li>Delivery location</li>
              <li>Product weight and size</li>
              <li>Vendor shipping policies</li>
              <li>Logistics provider fees</li>
            </ul>

            <p className="mt-3">
              Some vendors may offer <strong>free shipping promotions</strong> on selected products.
            </p>
          </section>

          {/* Tracking */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              4. Order Tracking
            </h2>

            <p>
              Once your order has been shipped, you may receive tracking
              information via email, SMS, or within your account
              dashboard.
            </p>

            <p className="mt-2">
              This allows you to monitor the progress of your delivery.
            </p>
          </section>

          {/* Delivery Issues */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              5. Delivery Issues
            </h2>

            <p>If you experience any issues with delivery, such as:</p>

            <ul className="list-disc pl-6 mt-3 space-y-1 text-sm">
              <li>Delayed delivery</li>
              <li>Missing package</li>
              <li>Incorrect delivery address</li>
              <li>Damaged package</li>
            </ul>

            <p className="mt-3">
              Please reach out to our
              support for assistance on <a
                  href="mailto:contact@karakata.market"
                  className="text-primary hover:underline"
                >contact@karakata.market</a> or WhatsApp <a
                  href="https://api.whatsapp.com/send?phone=2348026888555"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >+234 802 6888 555</a>
            </p>
          </section>

          {/* Vendor Responsibility */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              6. Vendor Responsibility
            </h2>

            <p>
              Vendors on Karakata Market are responsible for properly
              packaging products and ensuring items are shipped promptly
              after orders are confirmed.
            </p>

            <p className="mt-2">
              Vendors who repeatedly fail to meet shipping standards may
              face penalties or removal from the platform.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              7. Contact Support
            </h2>

            <p>If you need assistance with shipping or delivery:</p>

            <div className="mt-3 text-sm space-y-1">
              <p>Email: <a href="mailto:contact@karakata.market" className="text-primary">contact@karakata.market</a></p>
              <p>Phone: <a href="tel:+2348026888555" className="text-primary">+234 802 688 8555</a></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ShippingPolicyPage;
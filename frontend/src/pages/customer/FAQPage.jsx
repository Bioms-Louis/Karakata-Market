import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

const faqs = [
  {
    question: "How do I create an account?",
    answer:
      "Click on the Sign Up button at the top of the page and fill in your details. Once registered, you can start shopping immediately."
  },
  {
    question: "How do I place an order?",
    answer:
      "Browse products, add items to your cart, and proceed to checkout. Fill in your delivery details and complete the payment process."
  },
  {
    question: "How long does delivery take?",
    answer:
      "Delivery typically takes between 1–5 business days depending on your location and the vendor's processing time."
  },
  {
    question: "Can I return a product?",
    answer:
      "Yes. If a product is defective or not as described, you can request a return within 7 days of delivery."
  },
  {
    question: "How do vendors receive payments?",
    answer:
      "Vendors receive payouts directly to their registered bank account after an order has been successfully delivered."
  },
  {
    question: "How can I become a vendor?",
    answer:
      "Click on the 'Become a Vendor' link in the navigation menu and complete the vendor application form."
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We support debit cards, bank transfers, and secure online payments through our payment partners."
  },
  {
    question: "Who do I contact for support?",
    answer:
      "You can contact our support team through the Contact Us page or by emailing contact@karakata.market"
  }
];

const FAQItem = ({ faq, index, activeIndex, setActiveIndex }) => {
  const isOpen = activeIndex === index;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setActiveIndex(isOpen ? null : index)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-semibold text-gray-900 text-sm">
          {faq.question}
        </span>

        <ChevronDown
          size={20}
          className={`transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
          {faq.answer}
        </div>
      )}
    </div>
  );
};

const FAQPage = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#fff4cc" }}
            >
              <HelpCircle size={28} style={{ color: "#3c1a5b" }} />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Frequently Asked Questions
          </h1>

          <p className="text-gray-500 max-w-lg mx-auto text-sm">
            Find answers to common questions about shopping, orders,
            delivery, and becoming a vendor on Karakata.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
            />
          ))}
        </div>

        {/* Support Section */}
        <div className="mt-12 text-center bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Still need help?
          </h3>

          <p className="text-gray-500 text-sm mb-4">
            If you didn't find the answer you were looking for, our support
            team is here to help.
          </p>
          
          <Link to="/contact">
            <button
            className="px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: "#ffc70e", color: "#3c1a5b" }}
          >
            Contact Support
          </button>
          </Link>
          
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
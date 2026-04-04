import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Twitter
} from "lucide-react";
import { FaTiktok, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const ContactPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Replace with API call later
    alert("Message sent successfully!");

    setForm({
      name: "",
      email: "",
      subject: "",
      message: ""
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Contact Us
          </h1>

          <p className="text-gray-500 max-w-lg mx-auto">
            Have questions, feedback, or need support? Our team is here to help.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Send us a message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                type="text"
                name="name"
                placeholder="Full Name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
              />

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
              />

              <input
                type="text"
                name="subject"
                placeholder="Subject"
                required
                value={form.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
              />

              <textarea
                name="message"
                rows="5"
                placeholder="Write your message..."
                required
                value={form.message}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: "#ffc70e", color: "#3c1a5b" }}
              >
                Send Message
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">

            {/* Address */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
              <MapPin className="text-purple-800" />
              <div>
                <h3 className="font-bold text-gray-900">Address</h3>
                <p className="text-sm text-gray-600">
                  2nd floor, Block A, Plot 1699 Sanusi Fafunwa St,<br />
                  Victoria Island 106104
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
              <Mail className="text-purple-800" />
              <div>
                <h3 className="font-bold text-gray-900">Email</h3>
                <a
                  href="mailto:contact@karakata.market"
                  className="text-sm text-gray-600 hover:underline"
                >
                  contact@karakata.market
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
              <Phone className="text-purple-800" />
              <div>
                <h3 className="font-bold text-gray-900">Phone</h3>
                <a
                  href="tel:+2348026888555"
                  className="text-sm text-gray-600 hover:underline"
                >
                  +234 802 688 8555
                </a>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
              <FaWhatsapp className="text-purple-800" size={32}/>
              <div>
                <h3 className="font-bold text-gray-900">WhatsApp</h3>
                <a
                  href="https://api.whatsapp.com/send?phone=2348026888555"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-gray-600 hover:underline"
                >
                  Chat with us
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">
                Follow Us
              </h3>

              <div className="flex gap-4">

                <a
                  href="https://www.facebook.com/people/Karakata-Market/61552533898425/"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <Facebook size={18} className="text-purple-800" />
                </a>

                <a
                  href="https://www.instagram.com/karakata_market/"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <Instagram size={18} className="text-purple-800" />
                </a>

                <a
                  href="https://www.linkedin.com/in/karakata-market-5b40a62a0/"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <Linkedin size={18} className="text-purple-800" />
                </a>

                <a
                  href="https://x.com/karakata81024"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <FaXTwitter size={18} className="text-purple-800" />
                </a>

                <a
                  href="https://www.tiktok.com/@karakatamarket"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <FaTiktok size={18} className="text-purple-800" />
                </a>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ContactPage;
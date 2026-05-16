import logo from '../../assets/logo.png';
import googlePlay from '../../assets/google-play.webp';
import appStore from '../../assets/app-store.webp';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaXTwitter, FaWhatsapp } from "react-icons/fa6";

const Footer = () => {
  return (
    <footer className="text-white bg-secondary">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="Karakata Market Logo" className="w-50 h-auto" /> 
              </div>
              <p className="text-purple-200 text-sm leading-relaxed">
                Nigeria's fastest growing one-stop marketplace.
              </p>
            </div>
              {[
              {
                title: 'Shop',
                links: [
                  { name: 'All Products', path: '/products' },
                  {name: 'Appliances', path: '/products?category=appliances'},
                  { name: 'Electronics', path: '/products?category=electronics' },
                  { name: 'Fashion', path: '/products?category=fashion' },
                  { name: 'Health & Beauty', path: '/products?category=health-beauty' },
                  { name: 'Phones & Tablets', path: '/products?category=phones-tablets' },
                  {name: 'Computing', path: '/products?category=Computing'},
                  {name: 'Home & Office', path: '/products?category=home-office'},
                  {name: 'Electronic Accessories', path: '/products?category=electronic-accessories'},
                  {name: 'Supermarket', path: '/products?category=supermarket'},
                  {name: 'Baby Products', path: '/products?category=baby-products'},
                  {name: 'Real Estate', path: '/products?category=real-estate'},
                ]
              },
              {
                title: 'Account',
                links: [
                  { name: 'My Orders', path: '/orders' },
                  { name: 'Profile', path: '/profile' },
                  { name: 'Become a Vendor', path: '/become-vendor' },
                ]
              },
              {
                title: 'Help',
                links: [
                  { name: 'Contact Us', path: '/contact' },
                  { name: 'FAQs', path: '/faqs' },
                  { name: 'Shipping Policy', path: '/shipping-policy' },
                  { name: 'Return Policy', path: '/return-policy' },
                  { name: 'Terms & Conditions', path: '/terms' },
                  { name: 'Privacy Policy', path: '/privacy' },
                ]
              }
            ].map(section => (
              <div key={section.title}>
                <h4 className="font-semibold mb-4" style={{ color: '#ffc70e' }}>
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map(link => (
                    <li key={link.name}>
                      <Link
                        to={link.path}
                        className="text-purple-200 hover:text-white text-sm transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          <div>
              <div className="mb-6">
                <h4 className="font-semibold mb-3" style={{ color: '#ffc70e' }}>
                  Contact Us
                </h4>
                <div className="text-purple-200 text-sm space-y-2">
                  <p>
                    2nd Floor, Block A<br />
                    Plot 1699 Sanusi Fafunwa St<br />
                    Victoria Island 106104
                  </p>

                  <p>
                    Email:{" "}
                    <a
                      href="mailto:contact@karakata.market"
                      className="hover:text-white"
                    >
                      contact@karakata.market
                    </a>
                  </p>

                  <p>
                    Phone:{" "}
                    <a
                      href="tel:+2348026888555"
                      className="hover:text-white"
                    >
                      +234 802 688 8555
                    </a>
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3" style={{ color: '#ffc70e' }}>
                  Stay Connected
                </h4>

                <div className="flex gap-4 text-xl text-purple-200">
                  <a href="https://www.facebook.com/people/Karakata-Market/61552533898425/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    <FaFacebook />
                  </a>

                  <a href="https://www.instagram.com/karakata_market/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    <FaInstagram />
                  </a>

                  <a href="https://x.com/karakata81024" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    <FaXTwitter />
                  </a>

                  <a href="https://www.linkedin.com/in/karakata-market-5b40a62a0/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    <FaLinkedin />
                  </a>

                  <a href="https://api.whatsapp.com/send?phone=2348026888555" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    <FaWhatsapp />
                  </a>

                  <a href="https://www.tiktok.com/@karakatamarket" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    <FaTiktok />
                  </a>
                </div>
              </div>

              <br></br>
              <h4 className="font-semibold mb-4" style={{ color: '#ffc70e' }}>
                Download Our App
              </h4>
              <div className="flex flex-col gap-3 mb-6">
                <a href="https://play.google.com/store/apps/details?id=com.karakata.shop">
                  <img
                    src={googlePlay}
                    alt="Get it on Google Play"
                    className="w-36 hover:opacity-90 transition"
                  />
                </a>

                <a href="https://apps.apple.com/ng/app/karakata-market/id6755254587">
                  <img
                    src={appStore}
                    alt="Download on App Store"
                    className="w-36 hover:opacity-90 transition"
                  />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row
            items-center justify-between gap-4">
            <p className="text-purple-300 text-sm">
              &copy; 2026 Karakata Market. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
  );
};

export default Footer;
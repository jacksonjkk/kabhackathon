import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, MapPin, Send, Headphones, MessageCircle, Phone, User, Pin, PenLine } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const handleChange = e => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setSent(false) }
  const handleSubmit = e => { e.preventDefault(); setSent(true); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }

  const features = [
    { icon: Headphones, title: 'Expert Support', desc: 'Get help from our livestock tech experts' },
    { icon: MessageCircle, title: 'Quick Response', desc: 'We typically respond within 24 hours' },
    { icon: Lock, title: 'Your Data is Safe', desc: 'We prioritize the security and privacy of your data' },
  ]

  const infoCards = [
    { icon: Mail, title: 'Email Us', desc: 'Send us an email anytime.', detail: 'support@bovipulse.com', link: true },
    { icon: MessageCircle, title: 'Response Time', desc: 'We typically respond within 2 working days.' },
    { icon: MapPin, title: 'Where We Work', desc: 'Built with smallholder dairy farmers in Kabale District, Uganda.' },
    { icon: Headphones, title: 'Academic Project', desc: 'BoviPulse is a final-year Computer Science build. Feedback welcome.' },
  ]

  return (
    <div className="min-h-screen bg-white pt-20">
      <Navbar />

      <section className="min-h-[calc(100vh-80px)] grid lg:grid-cols-2 overflow-hidden">
        <div className="px-6 lg:pl-20 lg:pr-12 py-16 lg:py-20 flex flex-col gap-5 relative z-10 bg-white">
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-bold tracking-[0.12em] text-green-600 uppercase flex items-center gap-2.5">
            <span>CONTACT US</span>
            <span className="w-8 h-0.5 rounded bg-green-600" />
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight">
            We're Here to Help<br /><span className="text-green-700">You and Your Herd</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-sm text-gray-600 leading-relaxed max-w-sm">
            Have questions about BoviPulse? Our team is ready to assist you.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col gap-4">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
              <div key={i} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0"><Icon size={20} className="text-green-700" /></div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{f.title}</div>
                  <div className="text-xs text-gray-500">{f.desc}</div>
                </div>
              </div>
              )
            })}
          </motion.div>
        </div>

        <div className="bg-gray-50 flex items-center justify-center p-6 lg:pr-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-extrabold text-green-700 mb-1.5">Send Us a Message</h2>
            <p className="text-xs text-gray-500 mb-6">Fill out the form below and we'll get back to you as soon as possible.</p>
            <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { name: 'name', placeholder: 'Full Name *', icon: User },
                  { name: 'email', placeholder: 'Email Address *', type: 'email', icon: Mail },
                ].map(f => {
                  const Icon = f.icon
                  return (
                  <div key={f.name} className="relative flex items-center">
                    <span className="absolute left-3.5 text-gray-400 pointer-events-none z-10"><Icon size={16} /></span>
                    <input name={f.name} value={form[f.name]} onChange={handleChange} type={f.type || 'text'} placeholder={f.placeholder} required
                      className="w-full pl-9 pr-3.5 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/10 transition-all" />
                  </div>
                  )
                })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400 pointer-events-none z-10"><Phone size={16} /></span>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number"
                    className="w-full pl-9 pr-3.5 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/10 transition-all" />
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400 pointer-events-none z-10"><Pin size={16} /></span>
                  <select name="subject" value={form.subject} onChange={handleChange}
                    className="w-full pl-9 pr-8 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/10 transition-all appearance-none">
                    <option value="">Subject *</option>
                    <option>General Inquiry</option>
                    <option>Technical Support</option>
                    <option>Sales</option>
                    <option>Partnership</option>
                  </select>
                </div>
              </div>
              <div className="relative flex items-start">
                <span className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none z-10"><PenLine size={16} /></span>
                <textarea name="message" value={form.message} onChange={handleChange} placeholder="Type your message here..." rows={4} required
                  className="w-full pl-9 pr-3.5 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-green-500 focus:bg-white focus:ring-3 focus:ring-green-500/10 transition-all resize-vertical" />
              </div>
              <button type="submit" className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-green-700 text-white text-sm font-bold rounded-lg hover:bg-green-800 transition-all hover:shadow-md active:scale-[0.97]">
                Send Message
                <Send size={16} />
              </button>
              {sent && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3.5 py-2.5" role="status">
                  Message noted. Thank you! (Demo build: messages stay in your browser and are not sent anywhere.)
                </p>
              )}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                <Lock size={12} /> Your information is secure and will never be shared.
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      <section className="bg-gray-50 py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {infoCards.map((c, i) => {
            const Icon = c.icon
            return (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-7 flex flex-col gap-2 hover:shadow-md transition-all">
              <div className="w-13 h-13 rounded-full bg-green-50 flex items-center justify-center mb-1"><Icon size={24} className="text-green-700" /></div>
              <h3 className="text-sm font-bold text-green-700">{c.title}</h3>
              <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{c.desc}</p>
              {c.detail && <span className="text-xs font-semibold text-green-600">{c.detail}</span>}
            </div>
            )
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-12 -mt-2">
        <div className="grid lg:grid-cols-[240px_1fr] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-md h-72">
          <div className="bg-green-800 p-8 flex flex-col gap-4 text-white">
            <MapPin size={28} />
            <div>
              <div className="text-sm font-bold">Our Region</div>
              <div className="text-xs font-semibold mt-1">Kabale District, Uganda</div>
              <div className="text-[11px] text-white/75">Designed with smallholder dairy farmers in the East African highlands.</div>
            </div>
          </div>
          <div className="bg-gray-100">
            <iframe title="Kabale District map" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127672.7!2d29.96!3d-1.24!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dc07ed0f0da3eb%3A0x4b6c8c8c8c8c8c8c!2sKabale%2C%20Uganda!5e0!3m2!1sen!2sus!4v1" width="100%" height="100%" style={{ border: 0, filter: 'saturate(0.7)' }} allowFullScreen="" loading="lazy" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

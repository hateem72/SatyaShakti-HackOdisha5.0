import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Mic, Shield, EyeOff, Lock, Send, ArrowRight, Play, 
  Users, Flag, Award, BarChart3, MessageCircle, Heart, 
  CheckCircle, ChevronDown, Volume2, Video, Star, 
  Upload, Sparkles, Target, Clock, Scissors, Edit3,
  User, Users as UsersIcon, Download, Info
} from 'lucide-react';

const SatyaShaktiLanding = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');
  const videoRef = useRef(null);

  const features = [
    {
      icon: <Mic size={36} />,
      title: "AI Voice Masking",
      description: "Our advanced neural networks instantly transform your voice while preserving your message's clarity and emotion. Sound completely different while maintaining natural speech patterns.",
      color: "teal",
      emphasis: true
    },
    {
      icon: <Video size={36} />,
      title: "Intelligent Video Blurring",
      description: "Dynamic background and facial obscuration technology to protect your identity completely.",
      color: "emerald"
    },
    {
      icon: <Lock size={36} />,
      title: "Zero-Trace Anonymity",
      description: "Military-grade encryption ensures no digital footprint remains after sharing your truth.",
      color: "blue"
    },
    {
      icon: <Send size={36} />,
      title: "Secure Sharing",
      description: "Content is distributed without any connection to your identity or personal information.",
      color: "purple"
    }
  ];

  const processSteps = [
    {
      step: "1",
      title: "Record Your Truth",
      description: "Use our secure interface to record your message, evidence, or testimony.",
      icon: <Mic size={24} />
    },
    {
      step: "2",
      title: "Auto-Voice Change",
      description: "Our AI instantly masks your voice while keeping your message clear and understandable.",
      icon: <Volume2 size={24} />,
      highlight: true
    },
    {
      step: "3",
      title: "Verify Anonymity",
      description: "Review your content to ensure all identifying elements have been properly secured.",
      icon: <CheckCircle size={24} />
    },
    {
      step: "4",
      title: "Share Securely",
      description: "Distribute your truth through our encrypted channels to the appropriate authorities or media.",
      icon: <Send size={24} />
    }
  ];

  const testimonials = [
    {
      name: "Rajesh K.",
      location: "Mumbai, Maharashtra",
      role: "Government Employee",
      content: "I had evidence of corruption in my department but feared for my job. SatyaShakti's voice changing technology allowed me to share the truth without anyone recognizing my voice. The system is incredible!",
      avatar: "RK",
      rating: 5
    },
    {
      name: "Priya S.",
      location: "Bengaluru, Karnataka",
      role: "Healthcare Worker",
      content: "When I witnessed medical malpractice, I knew I had to speak up. SatyaShakti protected my identity completely. The voice masking feature is so natural - nobody could tell it was me!",
      avatar: "PS",
      rating: 5
    },
    {
      name: "Amit J.",
      location: "Delhi",
      role: "Journalist",
      content: "I've used SatyaShakti to protect my sources multiple times. The automatic voice alteration is seamless and maintains the emotional intent of the speaker while making them unrecognizable.",
      avatar: "AJ",
      rating: 5
    },
    {
      name: "Sunita M.",
      location: "Chennai, Tamil Nadu",
      role: "Teacher",
      content: "I exposed exam paper leaks at my school without fear of retaliation. The voice change technology is amazing - it made me sound completely different while keeping my message clear.",
      avatar: "SM",
      rating: 5
    }
  ];

  const anonymousEditorFeatures = [
    {
      icon: <Clock size={28} />,
      title: "Timeline-Based Editing",
      description: "Precise control over when anonymization effects are applied with drag-to-select functionality"
    },
    {
      icon: <Scissors size={28} />,
      title: "Segmented Processing",
      description: "Apply voice changes or blurring to specific parts of your video while keeping other sections original"
    },
    {
      icon: <UsersIcon size={28} />,
      title: "Multiple Voice Options",
      description: "Choose from various AI voices with different styles, languages, and accents for perfect voice masking"
    },
    {
      icon: <Edit3 size={28} />,
      title: "Advanced Controls",
      description: "Fine-tune blur strength, timing, and other parameters for optimal anonymization results"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 overflow-auto">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
          <div className="w-full max-w-4xl mx-auto text-center">
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-emerald-600">
              SatyaShakti
            </h1>
          </div>
        </div>

        <div className="text-center px-4 max-w-6xl mx-auto pt-5 relative z-10">
          <div className="">
            <div className="inline-flex items-center bg-teal-100 text-teal-800 rounded-full px-6 py-2 text-sm font-medium mb-6">
              <Shield className="mr-2" size={16} /> Empowering Truth Through Technology
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 drop-shadow-sm">
              SatyaShakti
          </h1>
          
          <p className="text-2xl md:text-4xl mb-8 text-gray-800 font-bold">
            The Power of Truth, <span className="text-emerald-600">Beyond Fear</span>
          </p>
          
          <p className="text-xl text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed">
            A secure platform where Indians can anonymously expose corruption, safety violations, 
            and important truths without fear of retaliation or exposure. Powered by advanced AI technology 
            that protects your identity while preserving your message.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link to="/fully-anonymous">
            <button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-10 py-5 rounded-2xl text-lg font-semibold flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
              Begin Your Journey <ArrowRight size={24} />
            </button>
            </Link>
            <Link to="/record-fake-voice">
            <button className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white px-10 py-5 rounded-2xl text-lg font-semibold flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md">
              <Play size={24} />
              How It Works
            </button>
            </Link>
          </div>

         
          
          <div className="mt-16 animate-bounce">
            <ChevronDown size={32} className="text-teal-600 mx-auto" />
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gradient-to-br from-teal-50 to-emerald-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-teal-900">
            Why <span className="text-emerald-600">Truth-Tellers</span> Stay Silent
          </h2>
          <p className="text-xl text-gray-700 text-center mb-16 max-w-3xl mx-auto">
            Many Indians witness important issues but fear the consequences of speaking up
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield size={48} />,
                title: "Fear of Exposure",
                description: "Worried about identity revelation and recognition by powerful entities",
                color: "red"
              },
              {
                icon: <Lock size={48} />,
                title: "Personal Risk",
                description: "Concerned about safety, security, and professional consequences",
                color: "blue"
              },
              {
                icon: <Users size={48} />,
                title: "Social Pressure",
                description: "Cultural and societal pressures prevent people from speaking up",
                color: "purple"
              },
              {
                icon: <Flag size={48} />,
                title: "Lack of Protection",
                description: "No secure channels available for anonymous truth-sharing",
                color: "green"
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-3xl p-8 shadow-2xl border border-teal-200 transform transition-all duration-300 hover:shadow-3xl hover:scale-105">
                <div className="text-teal-600 mb-6">
                  <div className="bg-teal-100 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800 text-center">{item.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
          <Link to="/record-fake-voice">
            <button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-10 py-5 rounded-2xl text-lg font-semibold flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl mx-auto">
              Protect Your Identity Now <Shield size={24} />
            </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Solution Section with Voice Focus */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-gray-800">
            Speak <span className="text-teal-600">Anonymously</span> with AI Voice Protection
          </h2>
          <p className="text-xl text-gray-700 text-center mb-16 max-w-4xl mx-auto">
            Our advanced technology automatically changes your voice while preserving your message's clarity and emotion
          </p>
          
          <div className="flex flex-col lg:flex-row gap-12 mb-16">
            <div className="lg:w-1/2">
              <div className="sticky top-24">
                <div className="bg-gradient-to-br from-teal-600 to-emerald-600 p-10 rounded-3xl text-white shadow-2xl border border-teal-300/30">
                  <div className="text-5xl font-bold mb-6">{features[activeFeature].title}</div>
                  <p className="text-xl mb-8">{features[activeFeature].description}</p>
                  <div className="flex gap-3 mb-8">
                    {features.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveFeature(index)}
                        className={`w-4 h-4 rounded-full transition-all duration-300 ${
                          index === activeFeature 
                            ? 'bg-white scale-125' 
                            : 'bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-8xl flex justify-center transform transition-transform duration-300 hover:scale-110">
                    {features[activeFeature].icon}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 space-y-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className={`p-8 rounded-3xl cursor-pointer transition-all duration-300 ${
                    activeFeature === index 
                      ? 'bg-teal-50 border-2 border-teal-200 shadow-xl transform scale-105' 
                      : 'bg-white hover:bg-teal-50 hover:shadow-lg'
                  } ${feature.emphasis ? 'ring-2 ring-teal-300' : ''}`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="text-teal-600 mb-6">
                    <div className={`bg-teal-100 p-4 rounded-2xl w-16 h-16 flex items-center justify-center ${
                      feature.emphasis ? 'ring-2 ring-teal-300' : ''
                    }`}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">{feature.description}</p>
                  {feature.emphasis && (
                    <button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all shadow-sm hover:shadow-md transform hover:scale-105">
                      Try Voice Demo <Volume2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 p-8 rounded-3xl mb-12 shadow-md">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="bg-yellow-100 p-4 rounded-2xl w-16 h-16 flex items-center justify-center">
                  <Volume2 className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Experience Our Voice Protection</h3>
                <p className="text-gray-700 text-lg mb-6">
                  Hear how our AI seamlessly transforms voices while maintaining clarity and emotional intent. 
                  Our technology makes you sound completely different while keeping your message powerful and authentic.
                </p>
                <button className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-yellow-700 hover:to-orange-700 text-white px-8 py-4 rounded-xl text-md font-semibold flex items-center gap-3 transition-all shadow-sm hover:shadow-md transform hover:scale-105">
                  <Play size={20} /> Listen to Voice Samples
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Anonymous Editor Pro Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-800 rounded-full px-6 py-3 text-sm font-medium mb-6">
              <Sparkles className="mr-2" size={16} /> Introducing Anonymous Editor Pro
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-emerald-600">
              Advanced Video Anonymization
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-4xl mx-auto">
              Our flagship tool for complete video privacy protection with professional-grade editing capabilities
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-8">
              {anonymousEditorFeatures.map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-3xl shadow-2xl border border-teal-200/50 transform transition-all duration-300 hover:shadow-3xl hover:scale-105">
                  <div className="bg-gradient-to-br from-teal-100 to-emerald-100 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-teal-200/50">
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-video mb-6">
                <video
                  ref={videoRef}
                  src="https://example.com/demo-video.mp4"
                  className="w-full h-full object-contain"
                  controls
                  poster="https://example.com/demo-poster.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <h4 className="text-xl font-bold mb-2">Anonymous Editor Pro Demo</h4>
                    <p className="text-sm opacity-90">See the power of AI anonymization in action</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Upload className="w-6 h-6 text-teal-600" />
                    <span className="font-semibold">Upload any video</span>
                  </div>
                  <span className="text-sm text-gray-600">MP4, MOV, AVI, WebM</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Scissors className="w-6 h-6 text-teal-600" />
                    <span className="font-semibold">Precise editing</span>
                  </div>
                  <span className="text-sm text-gray-600">Drag to select segments</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Download className="w-6 h-6 text-teal-600" />
                    <span className="font-semibold">Download secure video</span>
                  </div>
                  <span className="text-sm text-gray-600">Protected & anonymous</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-12 py-6 rounded-3xl text-xl font-semibold flex items-center justify-center gap-4 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
              Try Anonymous Editor Pro <ArrowRight size={28} />
            </button>
            <p className="text-gray-600 mt-4 text-lg">
              Complete privacy protection for interviews, presentations, and sensitive content
            </p>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gradient-to-br from-teal-50 to-emerald-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-gray-800">
            How <span className="text-teal-600">SatyaShakti</span> Works
          </h2>
          <p className="text-xl text-gray-700 text-center mb-16 max-w-4xl mx-auto">
            A simple, secure process to share your truth without fear
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {processSteps.map((step, index) => (
              <div key={index} className={`bg-white p-8 rounded-3xl shadow-2xl border border-teal-200/50 transition-all duration-300 hover:shadow-3xl hover:scale-105 ${
                step.highlight ? 'ring-2 ring-teal-300 transform scale-105' : ''
              }`}>
                <div className="text-5xl font-bold text-teal-600 mb-6">{step.step}</div>
                <div className="flex items-center mb-4">
                  <div className="bg-teal-100 p-3 rounded-xl mr-4">
                    {step.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{step.title}</h3>
                </div>
                <p className="text-gray-700 text-lg leading-relaxed">{step.description}</p>
                {step.highlight && (
                  <button className="mt-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all shadow-sm hover:shadow-md transform hover:scale-105">
                    Try It Now <Mic size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-12 py-6 rounded-3xl text-xl font-semibold flex items-center justify-center gap-4 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl mb-6">
              Start the Process <ArrowRight size={28} />
            </button>
            <p className="text-gray-600 text-lg">
              Your identity remains protected throughout every step
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials & CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-teal-900">
            Hear From <span className="text-emerald-600">Courageous</span> Indians
          </h2>
          <p className="text-xl text-gray-700 text-center mb-16 max-w-4xl mx-auto">
            Real people using SatyaShakti to make a difference across India
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-3xl shadow-2xl border border-teal-200/50 transition-all duration-300 hover:shadow-3xl hover:scale-105">
                <div className="flex items-start mb-6">
                  <div className="bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-800 w-14 h-14 rounded-full flex items-center justify-center font-bold mr-4 text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.location}</p>
                  </div>
                </div>
                <div className="flex mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={20} className="text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 text-lg italic leading-relaxed">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="bg-white p-10 rounded-3xl shadow-2xl border border-teal-200/50">
              <h3 className="text-4xl font-bold mb-8 text-gray-800">Real Impact</h3>
              
              <div className="space-y-8">
                {[
                  { icon: <Award size={28} />, text: "Exposure of corruption saving taxpayers ₹2.3+ crore" },
                  { icon: <BarChart3 size={28} />, text: "Revelation of dangerous working conditions leading to safety reforms" },
                  { icon: <MessageCircle size={28} />, text: "Uncovering of educational malpractices resulting in policy changes" },
                  { icon: <Heart size={28} />, text: "Protection of thousands of truth-tellers across India" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-gradient-to-br from-teal-100 to-emerald-100 p-4 rounded-2xl mr-6 flex-shrink-0">
                      {item.icon}
                    </div>
                    <span className="text-gray-800 text-xl font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-teal-600 to-emerald-600 text-white p-10 rounded-3xl shadow-2xl">
              <h3 className="text-4xl font-bold mb-8">Ready to Make a Difference?</h3>
              <p className="text-xl mb-10 leading-relaxed">
                Join thousands of courageous Indians who are using SatyaShakti to create positive change without fear.
              </p>
              
              <div className="space-y-6">
                <button className="w-full bg-white text-teal-600 px-8 py-5 rounded-2xl font-semibold flex items-center justify-center gap-4 text-lg transition-all hover:bg-teal-50 hover:shadow-md transform hover:scale-105">
                  Begin Anonymously <EyeOff size={24} />
                </button>
                
                <button className="w-full bg-teal-800/30 text-white px-8 py-5 rounded-2xl font-semibold flex items-center justify-center gap-4 text-lg transition-all hover:bg-teal-800/50 hover:shadow-md transform hover:scale-105">
                  Learn More About Protection <Shield size={24} />
                </button>

                <button className="w-full bg-emerald-800/30 text-white px-8 py-5 rounded-2xl font-semibold flex items-center justify-center gap-4 text-lg transition-all hover:bg-emerald-800/50 hover:shadow-md transform hover:scale-105">
                  Try Voice Changing Demo <Volume2 size={24} />
                </button>
              </div>
              
              <div className="mt-10 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <p className="text-center italic text-lg">
                  "SatyaShakti's voice changing technology gave me the confidence to expose corruption without fearing for my family's safety."
                </p>
                <p className="text-center mt-4 font-semibold text-lg">- Anonymous Government Employee</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 text-xl">
              <span className="font-bold">SatyaShakti</span> - The Power of Truth, Beyond Fear
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SatyaShaktiLanding;
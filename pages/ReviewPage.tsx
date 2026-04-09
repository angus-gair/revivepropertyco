import React from 'react';
import { Link } from 'react-router-dom';
import { usePageSEO } from '../hooks/usePageSEO';
import { SEO } from '../seoConfig';
import {
  Star,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  CheckCircle
} from 'lucide-react';

const ReviewPage: React.FC = () => {
  usePageSEO({
    title: 'Leave a Review | Revive Property Co. Canberra',
    description: 'Share your experience with Revive Property Co. Your feedback helps Canberra homeowners find trusted property maintenance services.',
    path: '/review',
    noindex: false
  });

  const businessName = 'Revive+Property+Co.';
  const address = '802/2+Marcus+Clarke+Street+Canberra+ACT+2601';

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-12 px-6 font-sans text-[#121212]">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#36453B] mb-8 transition-colors">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#36453B]/10 rounded-full mb-6">
            <Star className="w-8 h-8 text-[#36453B] fill-[#36453B]" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-[#121212] mb-4">
            How Was Your Experience?
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Your feedback helps Canberra homeowners find trusted property maintenance services.
            Thank you for choosing Revive Property Co.
          </p>
        </div>

        {/* Business Info Card */}
        <div className="bg-white border border-[#121212]/5 shadow-sm p-8 mb-8">
          <h2 className="text-xl font-black uppercase tracking-tight mb-6 text-[#36453B]">
            Revive Property Co.
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-slate-400" />
              <span>802/2 Marcus Clarke Street, Canberra ACT 2601</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-slate-400" />
              <span>02 8201 3710</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-slate-400" />
              <span>angus@gair.com.au</span>
            </div>
          </div>
        </div>

        {/* Review Platforms */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 mb-4">
            Leave a Review On
          </h3>

          {/* Google Business Profile - Primary */}
          <a
            href={`https://search.google.com/local/writereview?placeid=ChIJJ1e6p9mL-f4Rv1qUZo-6k5E`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white border-2 border-[#36453B] p-6 hover:bg-[#36453B] hover:text-white transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#36453B] group-hover:bg-white rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white group-hover:text-[#36453B]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-lg">Google</p>
                  <p className="text-sm opacity-70">Primary review platform</p>
                </div>
              </div>
              <ExternalLink size={20} className="opacity-50 group-hover:opacity-100" />
            </div>
          </a>

          {/* Other Platforms - Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Facebook */}
            <a
              href="https://www.facebook.com/review"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#121212]/10 p-4 hover:border-[#36453B]/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Facebook</p>
                  <p className="text-xs text-slate-500">Share your experience</p>
                </div>
              </div>
            </a>

            {/* True Local */}
            <a
              href="https://www.truelocal.com.au"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#121212]/10 p-4 hover:border-[#36453B]/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold">True Local</p>
                  <p className="text-xs text-slate-500">Australian directory</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* What to Include */}
        <div className="mt-12 bg-[#F8F7F4] p-8 border border-[#121212]/5">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[#36453B] mb-4">
            Helpful Tips for Your Review
          </h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <CheckCircle size={16} className="text-[#36453B] mt-0.5 flex-shrink-0" />
              <span>Which service did you receive? (pressure washing, regrouting, garden, pool, rubbish removal)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle size={16} className="text-[#36453B] mt-0.5 flex-shrink-0" />
              <span>Was our team punctual, professional, and friendly?</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle size={16} className="text-[#36453B] mt-0.5 flex-shrink-0" />
              <span>Were you satisfied with the quality of work?</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle size={16} className="text-[#36453B] mt-0.5 flex-shrink-0" />
              <span>Would you recommend Revive Property Co. to others?</span>
            </li>
          </ul>
        </div>

        {/* Thank You */}
        <div className="mt-8 text-center">
          <ThumbsUp className="w-8 h-8 text-[#36453B] mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            Thank you for supporting our local Canberra business.
            <br />Your review helps us grow and serve more homeowners.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;

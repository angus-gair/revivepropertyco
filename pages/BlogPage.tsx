import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react';
import { usePageSEO } from '../hooks/usePageSEO';
import { SEO } from '../seoConfig';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: boolean;
  tags: string[];
}

// Placeholder structure - actual blog posts to be written
const blogPosts: BlogPost[] = [
  {
    id: 'pressure-washing-cost-canberra',
    title: 'How Much Does Pressure Washing Cost in Canberra? (2026 Guide)',
    excerpt: 'Complete pricing guide for pressure washing services in Canberra. Learn what affects costs and get accurate quotes for driveways, patios, and more.',
    category: 'Pricing Guide',
    date: 'Coming Soon',
    readTime: '8 min read',
    image: false,
    tags: ['Pressure Washing', 'Pricing', 'Canberra'],
  },
  {
    id: 'leaking-shower-signs',
    title: 'Signs Your Shower Is Leaking Behind the Tiles',
    excerpt: 'Don\'t wait for water damage to become visible. Learn the early warning signs of a leaking shower and what to do about it.',
    category: 'Problem-Solving',
    date: 'Coming Soon',
    readTime: '5 min read',
    image: false,
    tags: ['Regrouting', 'Waterproofing', 'Tips'],
  },
  {
    id: 'canberra-garden-winter',
    title: 'Preparing Your Canberra Garden for Winter',
    excerpt: 'Essential tasks to protect your garden through the cold months. From mulching to pruning, we cover everything Canberra homeowners need to know.',
    category: 'Seasonal',
    date: 'Coming Soon',
    readTime: '6 min read',
    image: false,
    tags: ['Garden', 'Winter', 'Maintenance'],
  },
  {
    id: 'epoxy-regrouting-vs-retile',
    title: 'Why Epoxy Regrouting Is Better Than Re-Tiling',
    excerpt: 'Compare epoxy regrouting to full tile replacement. Discover why epoxy grout offers superior waterproofing at a fraction of the cost.',
    category: 'Comparison',
    date: 'Coming Soon',
    readTime: '7 min read',
    image: false,
    tags: ['Regrouting', 'Comparison', 'Cost'],
  },
  {
    id: 'pool-maintenance-checklist',
    title: 'Pool Maintenance Checklist for Canberra Summers',
    excerpt: 'Keep your pool crystal clear all summer with this comprehensive maintenance checklist. Chemical levels, cleaning schedules, and more.',
    category: 'Educational',
    date: 'Coming Soon',
    readTime: '10 min read',
    image: false,
    tags: ['Pool', 'Summer', 'Checklist'],
  },
  {
    id: 'kingston-driveway-case-study',
    title: 'Before & After: Kingston Driveway Transformation',
    excerpt: 'See the dramatic results of our professional pressure washing on a heavily stained Kingston driveway.',
    category: 'Case Study',
    date: 'Coming Soon',
    readTime: '4 min read',
    image: false,
    tags: ['Before/After', 'Pressure Washing', 'Kingston'],
  },
];

const categories = ['All', 'Pricing Guide', 'Problem-Solving', 'Seasonal', 'Comparison', 'Educational', 'Case Study'];

const BlogPage: React.FC = () => {
  usePageSEO(SEO.blog);

  return (
    <div className="bg-[#FDFCFB] min-h-screen">
      {/* Hero Section */}
      <section className="bg-[#121212] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center space-x-5 mb-8">
            <span className="w-12 h-px bg-[#36453B]"></span>
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#36453B]">Resources</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-8">
            Guides & Tips.
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Expert advice on property maintenance in Canberra. From cost guides to seasonal tips, we help you make informed decisions about your home.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-[#F8F7F4] p-8 lg:p-12">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#36453B] mb-4">
              <span>Featured</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-[#121212] mb-4">
              {blogPosts[0].title}
            </h2>
            <p className="text-slate-600 mb-6 max-w-2xl">{blogPosts[0].excerpt}</p>
            <div className="flex items-center gap-6 text-sm text-slate-400 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{blogPosts[0].date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{blogPosts[0].readTime}</span>
              </div>
            </div>
            <Link to={`/blog/${blogPosts[0].id}`} className="inline-flex items-center gap-2 bg-[#121212] text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#36453B]">
              Read Article
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button key={category} className="px-4 py-2 text-xs font-medium hover:bg-slate-100 transition-colors">
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.slice(1).map((post) => (
              <article key={post.id} className="group">
                {/* Placeholder for post image */}
                <div className="aspect-[16/10] bg-slate-100 mb-4 flex items-center justify-center">
                  <span className="text-slate-300 text-sm">Image Placeholder</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#36453B] mb-2">
                  <span>{post.category}</span>
                </div>

                <h3 className="text-lg font-black uppercase tracking-tight text-[#121212] mb-2 group-hover:text-[#36453B] transition-colors">
                  <Link to={`/blog/${post.id}`}>{post.title}</Link>
                </h3>

                <p className="text-sm text-slate-500 mb-4 line-clamp-3">{post.excerpt}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <Link to={`/blog/${post.id}`} className="text-[#36453B] hover:text-[#121212]">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                  {post.tags.map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-300" />
                      <span className="text-[10px] text-slate-400">{tag}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#36453B] py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Get Monthly Tips</h2>
          <p className="text-slate-300 mb-8">
            Subscribe for seasonal maintenance reminders, exclusive offers, and expert advice.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-3 bg-white border-0 text-sm"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-[#121212] text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-[#121212] transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;

import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clean up tables to prevent duplicate entries on multiple runs
  await prisma.gallery.deleteMany({});
  await prisma.testimonial.deleteMany({});
  await prisma.fAQ.deleteMany({});

  // 1. Create Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const salesPasswordHash = await bcrypt.hash('sales123', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@riyasilk.com' },
    update: {},
    create: {
      email: 'admin@riyasilk.com',
      name: 'Chirag Admin',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`Created admin user: ${adminUser.email}`);

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@riyasilk.com' },
    update: {},
    create: {
      email: 'sales@riyasilk.com',
      name: 'Riya Sales',
      passwordHash: salesPasswordHash,
      role: Role.SALES,
    },
  });
  console.log(`Created sales user: ${salesUser.email}`);

  // 2. Create Categories
  const categoryNames = ['Corporate', 'Healthcare', 'Hospitality', 'Industrial', 'Security'];
  const categories: Record<string, any> = {};

  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories[name.toLowerCase()] = cat;
    console.log(`Created category: ${cat.name}`);
  }

  // 3. Create Products
  const productsData = [
    {
      title: 'Executive Slim Fit Shirt',
      slug: 'executive-slim-fit-shirt',
      shortDescription: 'Premium cotton blend executive wear shirt.',
      description: 'Engineered for comfort during long client-facing shifts. Features wrinkle-resistant technology, easy iron properties, and premium double stitching.',
      categoryName: 'corporate',
      moq: 50,
      availableSizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
      availableColors: ['Navy Blue', 'Sky Blue', 'White', 'Charcoal'],
      fabricComposition: '60% Cotton, 40% Polyester',
      isFeatured: true,
      images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500'],
    },
    {
      title: 'Classic Tailored Blazer',
      slug: 'classic-tailored-blazer',
      shortDescription: 'Professional wool-look classic fit blazer.',
      description: 'Elegant tailored blazers that elevate your corporate identity. Full satin lining, structured fit, and scratch-resistant buttons.',
      categoryName: 'corporate',
      moq: 30,
      availableSizes: ['M', 'L', 'XL', 'XXL'],
      availableColors: ['Navy Blue', 'Black', 'Charcoal'],
      fabricComposition: '70% Polyester, 30% Viscose',
      isFeatured: true,
      images: ['https://images.unsplash.com/photo-1598808503742-f84add95332b?w=500'],
    },
    {
      title: 'Clinical V-Neck Scrubs',
      slug: 'clinical-v-neck-scrubs',
      shortDescription: 'Antimicrobial comfort stretch medical scrubs.',
      description: 'Hygienic apparel engineered for ultimate comfort during long clinical shifts. Moisture-wicking fabric with four pocket utility design.',
      categoryName: 'healthcare',
      moq: 50,
      availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      availableColors: ['Teal', 'Royal Blue', 'Medical Green', 'Wine'],
      fabricComposition: '72% Polyester, 21% Rayon, 7% Spandex',
      isFeatured: true,
      images: ['https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500'],
    },
    {
      title: 'Premium Lab Coat',
      slug: 'premium-lab-coat',
      shortDescription: 'Unisex fluid-resistant professional lab coat.',
      description: 'Classic notched lapel lab coat featuring protective barrier technology, side pocket slits for trouser access, and reinforced seams.',
      categoryName: 'healthcare',
      moq: 50,
      availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
      availableColors: ['Lab White'],
      fabricComposition: '65% Polyester, 35% Cotton',
      isFeatured: false,
      images: ['https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500'],
    },
    {
      title: 'Classic Chef Double-Breasted Jacket',
      slug: 'classic-chef-double-breasted-jacket',
      shortDescription: 'Heat-resistant premium cotton chef coat.',
      description: 'Elegant double-breasted culinary jacket with breathable mesh back panel, thermometer sleeve pocket, and cloth-covered safety buttons.',
      categoryName: 'hospitality',
      moq: 40,
      availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
      availableColors: ['Chef White', 'Midnight Black'],
      fabricComposition: '100% Egyptian Cotton',
      isFeatured: true,
      images: ['https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=500'],
    },
    {
      title: 'Heavy Duty Boiler Suit',
      slug: 'heavy-duty-boiler-suit',
      shortDescription: 'Flame-retardant industrial coverall overalls.',
      description: 'Rugged, safety-compliant workwear built for maximum protection and durability. Multi-pocket design, action back for flexibility, and heavy-duty brass zippers.',
      categoryName: 'industrial',
      moq: 50,
      availableSizes: ['M', 'L', 'XL', 'XXL', '3XL', '4XL'],
      availableColors: ['Orange', 'Navy Blue', 'Grey'],
      fabricComposition: '100% Flame-Resistant Treated Cotton',
      isFeatured: true,
      images: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500'],
    },
    {
      title: 'Tactical Duty Patrol Shirt',
      slug: 'tactical-duty-patrol-shirt',
      shortDescription: 'Ripstop fabric professional security shirt.',
      description: 'Authoritative design with tactical strength. Features shoulder epaulets, dual chest pockets, badge tab, and Teflon dirt-repellent coating.',
      categoryName: 'security',
      moq: 50,
      availableSizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
      availableColors: ['Navy Blue', 'Black', 'Police Khaki'],
      fabricComposition: '65% Polyester, 35% Cotton Ripstop',
      isFeatured: true,
      images: ['https://images.unsplash.com/photo-1544216717-3bbf52512659?w=500'],
    }
  ];

  for (const item of productsData) {
    const category = categories[item.categoryName];
    if (!category) continue;

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        title: item.title,
        slug: item.slug,
        shortDescription: item.shortDescription,
        description: item.description,
        categoryId: category.id,
        moq: item.moq,
        availableSizes: item.availableSizes,
        availableColors: item.availableColors,
        fabricComposition: item.fabricComposition,
        isFeatured: item.isFeatured,
        images: {
          create: item.images.map((url) => ({ url })),
        },
      },
    });
    console.log(`Created product: ${product.title}`);
  }

  // 4. Create Gallery Items
  console.log('Seeding gallery...');
  const galleryData = [
    {
      title: 'Executive Shirts & Blazers',
      category: 'Corporate',
      description: 'Embroidery detail shot',
      imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
      isFeatured: true,
      order: 1,
    },
    {
      title: 'Clinical Scrubs & Lab Coats',
      category: 'Healthcare',
      description: 'Scrubs team placement',
      imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500',
      isFeatured: true,
      order: 2,
    },
    {
      title: 'Front-Desk Vests & Chef Wear',
      category: 'Hospitality',
      description: 'Front desk staff uniform',
      imageUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=500',
      isFeatured: true,
      order: 3,
    },
    {
      title: 'Tailored Blazers & Sweaters',
      category: 'Education', // mapped to "Education" on filters but "Schools" on db
      description: 'Student uniform sample',
      imageUrl: 'https://images.unsplash.com/photo-1598808503742-f84add95332b?w=500',
      isFeatured: true,
      order: 4,
    },
    {
      title: 'Durable Overalls & Safety Wear',
      category: 'Industrial',
      description: 'Heavy workwear seam close-up',
      imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500',
      isFeatured: true,
      order: 5,
    },
    {
      title: 'Badged Duty Shirts & Jackets',
      category: 'Security',
      description: 'Patrol duty shirt detail',
      imageUrl: 'https://images.unsplash.com/photo-1544216717-3bbf52512659?w=500',
      isFeatured: true,
      order: 6,
    },
  ];

  for (const item of galleryData) {
    await prisma.gallery.create({
      data: item,
    });
  }

  // 5. Create Testimonials
  console.log('Seeding testimonials...');
  const testimonialsData = [
    {
      name: 'Multi-Specialty Hospital System',
      designation: 'Maharashtra Region',
      company: 'Healthcare',
      category: 'Healthcare',
      rating: 5,
      quote: 'Sourcing clinical scrubs for over 300 staff members was managed seamlessly. Riya Silk sorted and labeled every delivery by department and sizing, making distribution stress-free. The fabrics have held up exceptionally well through heavy wash cycles.',
      isFeatured: true,
      region: 'Maharashtra Region',
    },
    {
      name: 'Financial Solutions Firm',
      designation: 'Pune Region',
      company: 'Corporate',
      category: 'Corporate',
      rating: 5,
      quote: 'We needed customized shirts and blazers matching our corporate colors. Riya Silk worked from our brand guidelines to match our colors exactly. Sizing verification was handled cleanly by a single account manager.',
      isFeatured: true,
      region: 'Pune Region',
    },
    {
      name: 'Private Educational Academy',
      designation: 'Aurangabad Region',
      company: 'Education',
      category: 'Education',
      rating: 5,
      quote: 'Delivered durable, fade-resistant blazers, daily shirts, and activewear for 1,200 students ahead of the academic year. Their order modification and re-ordering system is highly transparent.',
      isFeatured: true,
      region: 'Aurangabad Region',
    },
  ];

  for (const item of testimonialsData) {
    await prisma.testimonial.create({
      data: item,
    });
  }

  // 6. Create FAQs
  console.log('Seeding FAQs...');
  const faqsData = [
    {
      question: 'What is your Minimum Order Quantity (MOQ)?',
      answer: 'Our Minimum Order Quantity (MOQ) depends on the product category and the level of customization required. Please contact our sales team to discuss your project requirements, and we will provide specific quantity guidance.',
      order: 1,
    },
    {
      question: 'Can you replicate our existing uniform design?',
      answer: 'Yes. We can replicate your current uniforms exactly. You can send us a physical sample, reference photographs, or a technical design drawing, and our tailoring team will match the cuts, colors, and branding details.',
      order: 2,
    },
    {
      question: 'Do you provide sample uniforms before bulk production?',
      answer: 'Yes. For bulk orders, we manufacture a physical uniform sample for your team to fit-test and review. We only begin mass production after receiving your formal approval sign-off on the sample.',
      order: 3,
    },
    {
      question: 'Can we customize the uniforms with our corporate branding and logos?',
      answer: 'Yes. We offer precision logo branding options including high-density computerized embroidery and quality screen printing matched to your corporate branding guidelines.',
      order: 4,
    },
    {
      question: 'What fabric options do you offer?',
      answer: 'We source a wide range of fabrics, including cotton, poly-cotton blends, polyester, and performance textiles. Our team recommends suitable fabric weights and compositions based on your industry, comfort requirements, and durability expectations.',
      order: 5,
    },
    {
      question: 'What are your production and delivery timelines?',
      answer: 'Typical production timelines depend on the order quantity, design customization, and fabric availability. We provide an estimated manufacturing and delivery schedule after reviewing your specific requirements.',
      order: 6,
    },
    {
      question: 'Do you deliver across India?',
      answer: 'Yes. We ship nationwide through established cargo and transport networks. Every bulk order is sorted by sizing, packed securely, and shipped with tracking information.',
      order: 7,
    },
    {
      question: 'Can we place repeat orders easily?',
      answer: 'Yes. We maintain detailed production records, fabric specifications, and embroidery digitizing files for all clients. This guarantees consistent colors, styling, and sizing for all future repeat orders.',
      order: 8,
    },
    {
      question: 'How do you calculate pricing?',
      answer: 'Every B2B quotation is calculated individually based on the uniform type, fabric selection, branding complexity, total order quantity, and delivery location.',
      order: 9,
    },
  ];

  for (const item of faqsData) {
    await prisma.fAQ.create({
      data: item,
    });
  }

  // 7. Create Homepage settings
  console.log('Seeding settings...');
  await prisma.homepageSetting.upsert({
    where: { id: 'current' },
    update: {
      companyName: 'Riya Silk',
      tagline: 'Bespoke Corporate Workwear & High-Output Uniform Manufacturing',
      heroTitle: 'Custom Uniform Manufacturing for Businesses That Demand Quality at Scale',
      heroSubtitle: 'Riya Silk designs and manufactures custom corporate workwear, clinical apparel, and industrial uniforms. We combine premium fabrics with state-of-the-art bulk production to deliver consistent quality, on-time, every time.',
      heroCtaText: 'Request Consultation & Samples',
      heroCtaLink: '#contact-section',
      statsCapacity: '5,000+',
      statsTailors: '150+',
      statsSqFt: '100K+',
      statsClients: '500+',
      contactPhone: '+91 99999 99999',
      contactEmail: 'info@riyasilk.com',
      contactAddress: 'Riya Silk Factory, Maharashtra, India',
      catalogPdfUrl: '/riyasilk_catalogue.pdf',
      gstNumber: '27AAACR1234M1ZS',
      msmeNumber: 'UDYAM-MH-12-1234567',
      googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.8123984950346!2d72.8360668!3d19.072049!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c91136b69cf1%3A0xe54e60309971936!2sMumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
    },
    create: {
      id: 'current',
      companyName: 'Riya Silk',
      tagline: 'Bespoke Corporate Workwear & High-Output Uniform Manufacturing',
      heroTitle: 'Custom Uniform Manufacturing for Businesses That Demand Quality at Scale',
      heroSubtitle: 'Riya Silk designs and manufactures custom corporate workwear, clinical apparel, and industrial uniforms. We combine premium fabrics with state-of-the-art bulk production to deliver consistent quality, on-time, every time.',
      heroCtaText: 'Request Consultation & Samples',
      heroCtaLink: '#contact-section',
      statsCapacity: '5,000+',
      statsTailors: '150+',
      statsSqFt: '100K+',
      statsClients: '500+',
      contactPhone: '+91 99999 99999',
      contactEmail: 'info@riyasilk.com',
      contactAddress: 'Riya Silk Factory, Maharashtra, India',
      catalogPdfUrl: '/riyasilk_catalogue.pdf',
      gstNumber: '27AAACR1234M1ZS',
      msmeNumber: 'UDYAM-MH-12-1234567',
      googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.8123984950346!2d72.8360668!3d19.072049!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c91136b69cf1%3A0xe54e60309971936!2sMumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

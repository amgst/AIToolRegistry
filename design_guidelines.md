# AI Tools Directory - Design Guidelines

## Design Approach: Reference-Based (AI Directory Leaders)

**Primary Inspiration**: aitoolnet.com, Product Hunt, There's An AI For That, Future Tools
**Key Principles**: Scannable discovery, visual hierarchy, trust signals, rapid comprehension

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary)**
- Background: 222 15% 8% (deep charcoal)
- Surface: 222 15% 12% (elevated cards)
- Primary: 262 83% 58% (vibrant purple - AI/tech feel)
- Accent: 173 80% 45% (teal - for verified/featured badges)
- Text Primary: 0 0% 98%
- Text Secondary: 0 0% 65%

**Light Mode**
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Primary: 262 83% 48%
- Accent: 173 70% 40%
- Text Primary: 222 15% 15%
- Text Secondary: 222 10% 45%

### B. Typography

**Font Families** (via Google Fonts)
- Headings: Inter (600, 700 weights)
- Body: Inter (400, 500 weights)
- Code/Tags: JetBrains Mono (400)

**Scale**
- Hero Title: text-5xl lg:text-6xl font-bold
- Section Headers: text-3xl lg:text-4xl font-semibold
- Tool Card Title: text-xl font-semibold
- Body: text-base
- Captions/Tags: text-sm

### C. Layout System

**Spacing Units**: Tailwind primitives - 4, 6, 8, 12, 16, 20, 24
- Card padding: p-6
- Section spacing: py-16 lg:py-24
- Grid gaps: gap-6 lg:gap-8

**Container Strategy**
- Full-width hero with max-w-7xl inner
- Content sections: max-w-7xl mx-auto px-6
- Tool cards grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4

### D. Component Library

**1. Hero Section**
- Height: min-h-[60vh] with centered content
- Large gradient background (purple to teal subtle gradient)
- Hero title with gradient text effect
- Search bar (prominent, centered, w-full max-w-3xl)
- Stats row: "12,000+ AI Tools" | "Updated Daily" | "Free to Browse"

**2. Tool Cards**
- Rounded corners (rounded-xl)
- Border: 1px subtle
- Hover: lift effect (transform translateY)
- Content: Tool logo/icon (64px), Title, Short description (2 lines), Category tag, Pricing tag, Visit button
- Badge system: "Featured", "New", "Trending" (top-right corner)

**3. Filter & Search System**
- Sticky top navigation bar with category pills
- Advanced filters sidebar (collapsible on mobile): Categories, Pricing (Free/Freemium/Paid), Features, Ratings
- Real-time search with results count

**4. Category Navigation**
- Horizontal scrolling pill buttons
- Active state with primary color background
- Icons for each category (Content AI, Image AI, Video AI, Code AI, Marketing AI, Data AI, etc.)

**5. Tool Detail Modal/Page**
- Full-width header with tool branding
- Two-column layout: Main info (left 2/3) + Sidebar (right 1/3)
- Image gallery/screenshots carousel
- Feature list with checkmarks
- Pricing table
- User reviews section
- Similar tools recommendations

**6. Admin Interface**
- Clean dashboard with stats cards
- Table view for tool management
- Form with image upload, category selection, feature tags
- Markdown editor for descriptions

### E. Interactive Elements

**Hover States**
- Tool cards: translateY(-2px) + shadow-lg
- Buttons: brightness increase
- Category pills: scale(1.05)

**Transitions**
- Global: transition-all duration-200 ease-in-out
- Cards: duration-300 for lift effect
- Modals: slide-in from right (duration-400)

**Animations**: Minimal
- Fade-in on scroll for tool cards (stagger effect)
- Skeleton loaders during data fetch
- Smooth page transitions

## Page-Specific Layouts

### Home/Directory Page
1. **Hero** (min-h-[60vh]): Gradient background, large centered search, value proposition
2. **Stats Bar**: Quick metrics about the directory
3. **Featured Tools** (grid-cols-4): Highlighted/trending tools
4. **Category Sections**: Multiple sections, each showcasing top tools per category
5. **Newsletter CTA**: Centered with email input and benefits list
6. **Footer**: Multi-column (Categories, Resources, Company, Social)

### Browse/All Tools Page
1. **Search & Filter Header**: Sticky with search + category pills
2. **Filter Sidebar** (left, w-64): Collapsible categories, pricing, features
3. **Tool Grid** (remaining space): 3-4 column responsive grid
4. **Pagination**: Load more button or infinite scroll

### Tool Detail Page
1. **Hero Banner**: Tool branding, name, tagline, primary CTA
2. **Quick Info Cards**: Category, Pricing, Rating, Last Updated
3. **Description Section**: Rich text with features list
4. **Screenshots Gallery**: 3-4 images in carousel
5. **Pricing Details**: Table or cards with plan comparison
6. **Reviews & Ratings**: User testimonials
7. **Related Tools**: 4-column grid

## Images

### Hero Section
**Large hero image**: Yes - A vibrant abstract illustration representing AI/technology
- Style: Gradient mesh or 3D abstract shapes in purple/teal tones
- Placement: Full-width background with overlay for text readability
- Dimensions: 1920x800px minimum
- Effect: Subtle parallax scroll or gradient animation

### Tool Cards
**Tool logos/icons**: Required for each tool
- Placement: Top-left or centered in card header
- Dimensions: 64x64px, rounded-lg
- Fallback: Colored initial avatar if no logo

### Tool Detail Pages
**Screenshot gallery**: 3-5 product screenshots
- Placement: Below description, above features
- Layout: Carousel with thumbnails
- Dimensions: 1200x800px per image

### Category Headers
**Category illustrations**: Optional decorative icons
- Style: Line art or duotone illustrations
- Placement: Next to category section titles
- Size: 80x80px

### General Visual Assets
- Abstract background patterns for section dividers
- Gradient overlays for depth
- Badge/tag graphics for "Featured", "New", "Trending"

## Trust & Social Proof Elements
- User review stars and counts on cards
- "Verified" badges for authenticated tools
- "Updated [time]" timestamps
- Community metrics: "Used by 50K+ people"
- Expert picks/editorial selections
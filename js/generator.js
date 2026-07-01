/* ============================================================================
   Generator — the content engine.
   Turns a business's brand-voice profile into ready-to-post social + Google
   Business posts. No backend: this composes voice-matched copy from
   business-type content banks, content-type templates, tone modifiers and
   platform formatting rules — the way a writer (or an LLM in their voice) would.
   ============================================================================ */
(function () {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const chance = (p) => Math.random() < p;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ----------  Business-type content banks  ---------- */
  // Each type seeds the copy with domain-specific tips, services, FAQs and
  // seasonal angles so a plumber never sounds like a gym.
  const TYPES = {
    plumber: {
      label: 'Plumbing', emoji: '🔧',
      services: ['drain cleaning', 'leak repair', 'water heater installs', 'emergency callouts', 'fixture upgrades', 'repiping'],
      tips: [
        'Never pour grease down the drain — let it cool and toss it in the bin instead',
        'Know where your main water shut-off valve is before you ever need it',
        'A running toilet can waste 200 gallons a day — that flapper is a 5-minute fix',
        'Hard water buildup shortens the life of your water heater — a yearly flush helps',
        'Those flushable wipes? They\'re not. They\'re the #1 cause of clogs we see',
        'A slow drain is your pipe warning you early — deal with it before it backs up',
      ],
      faqs: [
        ['Why is my water bill suddenly higher?', 'Nine times out of ten it\'s a silent leak — often the toilet. We can find it fast.'],
        ['Do I really need a pro for a small leak?', 'A drip today is a ceiling repair tomorrow. Catching it early is the cheap option.'],
        ['How long does a water heater last?', 'Usually 8–12 years. If yours is creeping up on that, let\'s talk before it fails.'],
      ],
      seasonal: { winter: 'Freezing pipes season is here — insulate exposed pipes and keep a faucet dripping on the coldest nights.', spring: 'Spring is prime time to check for slow leaks that hid all winter.', summer: 'Sprinkler and outdoor-tap season — let\'s make sure nothing\'s leaking underground.', fall: 'Get ahead of winter: we\'ll pressure-test and insulate before the first freeze.' },
      review: 'a burst-pipe emergency handled', keywords: ['emergency plumber', 'drain cleaning', 'licensed plumber'],
    },
    gym: {
      label: 'Fitness', emoji: '💪',
      services: ['personal training', 'group classes', 'strength coaching', 'nutrition guidance', 'small-group HIIT', 'mobility work'],
      tips: [
        'You don\'t need to train harder — you need to train more consistently. 3 solid days beats 1 heroic one',
        'Progress isn\'t just the scale. Track your lifts, your sleep, how your clothes fit',
        'Warm up for real. Five minutes now saves you six weeks on the sidelines',
        'Protein at every meal is the boring secret behind every result you envy',
        'Rest days are where the muscle is actually built — don\'t skip them',
        'The best workout is the one you\'ll actually come back and do tomorrow',
      ],
      faqs: [
        ['I\'m a total beginner — is this place for me?', 'Especially for you. Everyone here started at day one. We\'ll meet you where you are.'],
        ['How long until I see results?', 'You\'ll feel stronger in 2–3 weeks. You\'ll see it in 6–8. Consistency is the whole game.'],
        ['Do I need a coach or can I just show up?', 'Both work — but members with a coach hit their goals about twice as fast.'],
      ],
      seasonal: { winter: 'New year, but let\'s skip the crash-and-burn. Small habits, kept all year — that\'s how it sticks.', spring: 'Spring reset: let\'s build the routine now so summer takes care of itself.', summer: 'Summer schedule\'s a mess? Early classes are open and quiet — come get it done before the day starts.', fall: 'Post-summer reset — back to routine, back to feeling strong.' },
      review: 'crushed their first 5k', keywords: ['personal trainer', 'gym near me', 'group fitness'],
    },
    salon: {
      label: 'Salon & Beauty', emoji: '💇',
      services: ['cuts & styling', 'color & balayage', 'treatments', 'blowouts', 'special-occasion styling', 'consultations'],
      tips: [
        'Wash less than you think. Every day strips the oils your hair needs to shine',
        'Heat protectant isn\'t optional — it\'s the difference between shiny and fried',
        'Book your trim every 6–8 weeks and your grow-out will actually look intentional',
        'Cold-water rinse at the end seals the cuticle and locks in your color',
        'Your at-home color and our salon color are not the same conversation — let\'s chat first',
        'Bring a photo. Even a "bad" reference tells us more than a paragraph',
      ],
      faqs: [
        ['How far ahead should I book for an event?', 'Two to three weeks for the date you want — sooner in wedding season.'],
        ['Can you fix a color that went wrong at home?', 'Almost always. Come in for a quick consult and we\'ll map a safe plan.'],
        ['How do I make my color last?', 'Sulfate-free shampoo, cooler water, and a gloss every few weeks. We\'ll set you up.'],
      ],
      seasonal: { winter: 'Winter dryness is real — ask about a hydrating treatment to survive the dry-heat months.', spring: 'Spring refresh season — lighter, brighter, ready for the sun. Let\'s plan it.', summer: 'Sun and chlorine are hard on color — a gloss keeps it vibrant all summer.', fall: 'Cozy season, richer tones — book your fall color transformation now.' },
      review: 'a bridal look that had the whole room talking', keywords: ['hair salon', 'balayage', 'haircut near me'],
    },
    cafe: {
      label: 'Café & Food', emoji: '☕',
      services: ['fresh pastries', 'specialty coffee', 'weekend brunch', 'catering', 'grab-and-go lunch', 'private bookings'],
      tips: [
        'The secret to our latte isn\'t the machine — it\'s beans roasted this week, not last month',
        'Order the special. It\'s what our team is most excited about that day',
        'Decaf after 2pm isn\'t sad, it\'s smart. Your sleep will thank you',
        'Ask us to hold the syrup and actually taste the coffee — you might be surprised',
        'Our pastries sell out by mid-morning. The early crowd knows',
        'Bring your own cup — you\'ll get a discount and the planet gets a win',
      ],
      faqs: [
        ['Do you do catering?', 'We do — from a box of pastries to full coffee service for your office. Just ask.'],
        ['Any dairy-free options?', 'Oat, almond and soy, all in-house. Your order, your way.'],
        ['Can I book the space?', 'Evenings and Sunday afternoons are open for private bookings — let\'s talk dates.'],
      ],
      seasonal: { winter: 'Cold out? The seasonal spiced latte is back and it\'s exactly what today needs.', spring: 'Patio\'s open ☀️ — spring menu is live with lighter bites and iced everything.', summer: 'Beat the heat: cold brew on tap and it\'s never been smoother.', fall: 'Yes, the pumpkin one is back. No, we\'re not sorry. Come get it.' },
      review: 'a catering order that made their meeting', keywords: ['coffee shop near me', 'best brunch', 'local cafe'],
    },
    dentist: {
      label: 'Dental', emoji: '🦷',
      services: ['cleanings & check-ups', 'whitening', 'fillings', 'emergency visits', 'Invisalign', 'kids\' dentistry'],
      tips: [
        'Two minutes, twice a day. Most people brush for about 45 seconds — set a timer and see',
        'Flossing isn\'t optional — it cleans the 40% of your tooth a brush never touches',
        'That sensitivity you\'re ignoring? It rarely fixes itself. Earlier is easier',
        'Swap your toothbrush every 3 months, or after any cold or flu',
        'Sipping soda all afternoon is worse than drinking it fast — the acid never lets up',
        'Bring the kids early. First visit by age one builds a lifetime of no-fear checkups',
      ],
      faqs: [
        ['I haven\'t been in years — will I get a lecture?', 'Never. No judgment, just a fresh start. We see it all the time.'],
        ['Does whitening actually work?', 'Professional whitening does, and safely. We\'ll tell you honestly what to expect.'],
        ['What counts as a dental emergency?', 'Pain, swelling, a knocked-out tooth — call us. Same-day slots are held for exactly this.'],
      ],
      seasonal: { winter: 'Use your benefits before they reset — year-end is the time to book that cleaning.', spring: 'Spring smile check — book the cleaning you\'ve been putting off.', summer: 'Get the kids in before school starts — summer slots fill fast.', fall: 'Back-to-school checkups are on — let\'s start the year cavity-free.' },
      review: 'a same-day emergency that saved their weekend', keywords: ['dentist near me', 'teeth whitening', 'family dentist'],
    },
    landscaping: {
      label: 'Landscaping', emoji: '🌿',
      services: ['lawn care', 'garden design', 'seasonal cleanups', 'hardscaping', 'tree & shrub care', 'irrigation'],
      tips: [
        'Mow high. Longer grass shades its own roots and crowds out weeds for free',
        'Water deep and early — a long soak at dawn beats a daily sprinkle every time',
        'Mulch isn\'t just looks — 2–3 inches locks in moisture and cuts your watering in half',
        'Sharp mower blades cut; dull ones tear and brown your tips. Sharpen each spring',
        'Right plant, right spot. Half of garden failures are just sun-loving plants in shade',
        'Don\'t bag every clipping — grasscycling feeds the lawn for free',
      ],
      faqs: [
        ['Do you do one-time cleanups or only contracts?', 'Both. A single spring blitz or a season-long plan — your call.'],
        ['When should I plant?', 'Spring and fall are the sweet spots. Tell us your yard and we\'ll time it right.'],
        ['Can you work with a small budget?', 'Absolutely — we\'ll phase it so your yard improves every season without the sticker shock.'],
      ],
      seasonal: { winter: 'Winter prep matters — let\'s wrap the shrubs and put the beds to rest right.', spring: 'Spring cleanup season is on — beds, mulch, and a fresh cut to wake the yard up.', summer: 'Beat the heat stress — let\'s dial in your watering before July does damage.', fall: 'Leaves, aeration, overseeding — fall is when next year\'s lawn is actually made.' },
      review: 'a backyard transformation the neighbors keep asking about', keywords: ['lawn care near me', 'landscaper', 'yard cleanup'],
    },
    autorepair: {
      label: 'Auto Repair', emoji: '🚗',
      services: ['oil changes', 'brake service', 'diagnostics', 'tire & alignment', 'AC repair', 'pre-trip inspections'],
      tips: [
        'That squeal when you brake is your pads asking for attention — don\'t wait for the grind',
        'Check your tire pressure monthly. It\'s free, it saves gas, and it saves tires',
        'The check-engine light isn\'t a suggestion — a quick scan now beats a tow later',
        'Oil is cheap. Engines are not. Stick to the interval and thank yourself at 150k',
        'Rotate your tires every oil change and they\'ll last thousands of miles longer',
        'Weird new noise? Record it on your phone — it helps us find it fast',
      ],
      faqs: [
        ['Do I need an appointment for an oil change?', 'Walk-ins welcome, but a quick booking gets you in and out faster.'],
        ['Will you tell me what\'s urgent vs. what can wait?', 'Always. We\'ll show you what\'s safety, what\'s soon, and what\'s fine for now.'],
        ['Can you look at it before a road trip?', 'That\'s exactly what a pre-trip inspection is for — let\'s catch it in the driveway, not the highway.'],
      ],
      seasonal: { winter: 'Cold kills weak batteries — let\'s test yours before it strands you in a parking lot.', spring: 'Post-winter check: pothole season is hard on alignment and tires. Let\'s look.', summer: 'AC not cold and road-trip season here? Bring it in before the heat wave.', fall: 'Get winter-ready: battery, tires, and fluids checked before the temperature drops.' },
      review: 'an honest diagnosis that saved them a needless repair', keywords: ['auto repair near me', 'brake service', 'oil change'],
    },
    cleaning: {
      label: 'Cleaning', emoji: '🧽',
      services: ['home cleaning', 'deep cleans', 'move-in/move-out', 'office cleaning', 'recurring service', 'post-reno cleanup'],
      tips: [
        'Clean top to bottom — dust falls, so ceilings and shelves before floors, always',
        'Microfiber over paper towels: it grabs dust instead of pushing it around',
        'A 10-minute nightly reset beats a 3-hour weekend marathon every single time',
        'Let your cleaner sit. Spray, walk away for two minutes, then wipe — it does the work for you',
        'Baking soda and vinegar handle most of your kitchen. Save the harsh stuff',
        'The most-touched spots — handles, switches, remotes — are the ones we never think to wipe',
      ],
      faqs: [
        ['Do you bring your own supplies?', 'Everything — products and equipment. You don\'t lift a finger.'],
        ['One-time deep clean or only recurring?', 'Either works. Many folks start with a deep clean, then keep it easy with biweekly upkeep.'],
        ['Are your products pet- and kid-safe?', 'Yes — we default to non-toxic and can go fully green on request.'],
      ],
      seasonal: { winter: 'Holiday hosting? Let us handle the before-and-after so you enjoy your own party.', spring: 'Spring cleaning, but you don\'t lift a finger — deep-clean slots are open.', summer: 'Moving season — our move-out cleans get deposits back. Let\'s book it.', fall: 'Reset before the holidays hit — a fall deep clean makes the season easier.' },
      review: 'a move-out clean that got their full deposit back', keywords: ['house cleaning near me', 'deep cleaning', 'maid service'],
    },
    hvac: {
      label: 'Heating & Cooling', emoji: '🌡️',
      services: ['AC repair', 'furnace service', 'installs', 'maintenance plans', 'duct cleaning', 'thermostat upgrades'],
      tips: [
        'Change your filter every 1–3 months — a clogged one makes your system work twice as hard',
        'That short-cycling AC isn\'t normal — it\'s a small fix now or a big bill later',
        'A smart thermostat pays for itself in a season or two. Set it and save',
        'Keep two feet clear around your outdoor unit — it needs to breathe to cool',
        'Weird smell when the heat kicks on the first time? Usually dust. If it lingers, call us',
        'Book your tune-up in the off-season — you\'ll skip the summer rush and the breakdown',
      ],
      faqs: [
        ['My system\'s old — repair or replace?', 'We\'ll give you the honest math on both. Sometimes a repair is smart; sometimes it\'s throwing money at borrowed time.'],
        ['How often do I really need maintenance?', 'Once a year per system. It catches small issues and keeps the warranty valid.'],
        ['Do you offer emergency service?', 'When the heat or AC quits, we move fast — same-day whenever we can.'],
      ],
      seasonal: { winter: 'Furnace season — a quick tune-up now is the difference between cozy and a 2am breakdown.', spring: 'Beat the summer rush: AC tune-ups are open now and half the wait.', summer: 'Heat wave incoming — if your AC struggled last year, let\'s fix it before it quits.', fall: 'Furnace check season — let\'s make sure your heat\'s ready before you need it.' },
      review: 'a no-heat emergency fixed the same night', keywords: ['ac repair near me', 'hvac service', 'furnace repair'],
    },
    petgrooming: {
      label: 'Pet Grooming', emoji: '🐾',
      services: ['full grooms', 'baths & tidy-ups', 'nail trims', 'de-shedding', 'puppy\'s first groom', 'specialty cuts'],
      tips: [
        'Brush between grooms — five minutes a few times a week stops the mats before they start',
        'Nails clicking on the floor? They\'re overdue, and long nails actually hurt their joints',
        'Start young. A puppy\'s first calm visits set them up to love the groomer for life',
        'Human shampoo is too harsh for their skin — stick to pet-safe or leave it to us',
        'A summer shave-down isn\'t always kinder — some coats protect against heat. Ask first',
        'Check ears and paws after every walk, especially in allergy season',
      ],
      faqs: [
        ['My dog gets anxious — can you handle that?', 'We do it every day. Calm, patient, no rushing. Nervous pups are our specialty.'],
        ['How often should I book?', 'Most coats do best every 4–8 weeks. We\'ll set a rhythm that fits your pup.'],
        ['Do you groom cats too?', 'We do — and we know it\'s a different world. Gentle handling, every time.'],
      ],
      seasonal: { winter: 'Winter coats trap salt and damp — a warm bath and paw check keeps them comfy.', spring: 'Shedding season is here 🐕 — a de-shed treatment saves your couch and their coat.', summer: 'Summer coat care isn\'t just a shave — let\'s do what\'s right for your breed.', fall: 'Cozy-season groom time — let\'s get that coat healthy before it thickens up.' },
      review: 'a nervous rescue pup\'s first calm groom', keywords: ['dog groomer near me', 'pet grooming', 'dog nail trim'],
    },
    realestate: {
      label: 'Real Estate', emoji: '🏡',
      services: ['buyer representation', 'listings & staging', 'market valuations', 'first-time buyer help', 'investment advice', 'relocation'],
      tips: [
        'Get pre-approved before you fall in love with a house — it\'s your negotiating power',
        'The listing price is a starting line, not a verdict. Let\'s read the actual comps',
        'First impressions sell — declutter and deep-clean before a single photo is taken',
        'Don\'t skip the inspection to win a bid. The problems don\'t disappear, they just become yours',
        'The best time to buy is when you\'re ready and the numbers work — not when a headline says so',
        'Small staging wins big: light, space, and a neutral palette photograph like money',
      ],
      faqs: [
        ['Is now a good time to buy or sell?', 'It depends on your street, not the national news. Let\'s look at your specific numbers.'],
        ['How much is my home actually worth?', 'I\'ll run a real comparative analysis — no guessing, no inflated promises.'],
        ['I\'m a first-time buyer and overwhelmed. Help?', 'That\'s the best call you can make. We\'ll walk every step together, no dumb questions.'],
      ],
      seasonal: { winter: 'Winter buyers are serious buyers — less competition, motivated sellers. Let\'s talk strategy.', spring: 'Spring is the busiest market of the year — if you\'re selling, now\'s the moment to prep.', summer: 'Family move before school starts? Summer timelines are tight — let\'s map it now.', fall: 'Fall market is a hidden gem — quality listings, fewer bidding wars. Let\'s look.' },
      review: 'a first-time buyer into the perfect home under budget', keywords: ['realtor near me', 'homes for sale', 'first-time buyer'],
    },
    other: {
      label: 'Local Business', emoji: '⭐',
      services: ['our core service', 'consultations', 'custom work', 'quick turnarounds', 'ongoing support', 'walk-ins'],
      tips: [
        'The best businesses aren\'t the biggest — they\'re the ones that answer the phone and show up',
        'Ask us anything before you commit. A good question saves everyone time',
        'Supporting local keeps your money in the neighborhood — thank you for choosing us',
        'Not sure what you need? Tell us the problem, not the solution — that\'s our job',
        'A little planning ahead gets you our best availability and our best price',
        'We\'d rather do it right than do it twice. Quality is the whole point',
      ],
      faqs: [
        ['How do I get started?', 'Just reach out — a quick chat tells us exactly how we can help.'],
        ['What makes you different?', 'We treat every job like it\'s for a neighbor, because usually it is.'],
        ['Do you offer free quotes?', 'We do — no pressure, no obligation, just an honest number.'],
      ],
      seasonal: { winter: 'Year-end is a great time to plan ahead — let\'s get you on the calendar early.', spring: 'Spring is a fresh start — a great time to tackle what you\'ve been putting off.', summer: 'Summer\'s busy for us — book ahead to get the slot you want.', fall: 'Fall is planning season — let\'s set you up before the year-end rush.' },
      review: 'a job done right the first time', keywords: ['local business', 'near me', 'trusted service'],
    },
  };

  /* ----------  Tone voice modifiers  ---------- */
  const TONES = {
    friendly: { openers: ['Hey neighbors!', 'Quick one for you 👋', 'Friendly reminder:', 'Real talk:'], signoffs: ['We\'re here whenever you need us.', 'Come say hi 👋', 'Always happy to help.'], emoji: true },
    professional: { openers: ['A quick note for our clients:', 'Worth knowing:', 'From our team:', 'Here\'s a tip we share often:'], signoffs: ['We\'re here to help.', 'Reach out to learn more.', 'Book a consultation anytime.'], emoji: false },
    bold: { openers: ['Listen up.', 'Here\'s the truth:', 'Stop scrolling —', 'No fluff:'], signoffs: ['Let\'s make it happen.', 'Your move.', 'Don\'t wait on this.'], emoji: false },
    playful: { openers: ['Okay, hot take 🔥', 'Gather round 🙌', 'Plot twist:', 'Fun fact 👀'], signoffs: ['You\'re welcome 😉', 'Go on, treat yourself.', 'See you soon! 🎉'], emoji: true },
  };

  const PLATFORMS = {
    instagram: { label: 'Instagram', icon: 'instagram', maxTags: 8, ctaStyle: 'bio' },
    facebook: { label: 'Facebook', icon: 'facebook', maxTags: 3, ctaStyle: 'inline' },
    google: { label: 'Google Business', icon: 'google', maxTags: 0, ctaStyle: 'button' },
  };

  const CONTENT_TYPES = [
    { key: 'tip', label: 'Expert Tip' },
    { key: 'promo', label: 'Promotion' },
    { key: 'seasonal', label: 'Seasonal' },
    { key: 'review', label: 'Review Request' },
    { key: 'testimonial', label: 'Testimonial' },
    { key: 'faq', label: 'FAQ' },
    { key: 'story', label: 'Behind the Scenes' },
    { key: 'community', label: 'Community' },
  ];

  function season(date = new Date()) {
    const m = date.getMonth();
    if (m <= 1 || m === 11) return 'winter';
    if (m <= 4) return 'spring';
    if (m <= 7) return 'summer';
    return 'fall';
  }

  function ctaButton(biz) {
    return pick(['Call now', 'Book online', 'Learn more', 'Get a quote', 'Message us']);
  }

  function inlineCta(biz) {
    const phone = biz.phone ? ` at ${biz.phone}` : '';
    return pick([
      `Call us${phone} to book.`,
      `Message us to get started.`,
      biz.website ? `Book online at ${biz.website}.` : `Give us a call to book.`,
      `Drop us a line — we\'d love to help.`,
    ]);
  }

  function hashtags(biz, type) {
    const t = TYPES[biz.type] || TYPES.other;
    const cityTag = biz.city ? '#' + biz.city.replace(/[^a-zA-Z0-9]/g, '') : '#ShopLocal';
    const nameTag = '#' + (biz.name || 'Local').replace(/[^a-zA-Z0-9]/g, '');
    const base = t.keywords.map((k) => '#' + k.replace(/[^a-zA-Z0-9]/g, ''));
    const generic = ['#SupportLocal', '#SmallBusiness', '#' + t.label.replace(/[^a-zA-Z0-9]/g, ''), '#LocalBusiness'];
    const all = [nameTag, cityTag, ...base, ...generic];
    // de-dupe, keep order
    return [...new Set(all)];
  }

  /* ----------  Per-type body builders  ---------- */
  function buildBody(biz, typeKey) {
    const t = TYPES[biz.type] || TYPES.other;
    const name = biz.name || 'our shop';
    const city = biz.city || 'the neighborhood';
    switch (typeKey) {
      case 'tip': {
        const tip = pick(t.tips);
        return { headline: pick(['Pro tip 💡', 'Save yourself a headache', 'Quick tip from the pros', 'Free advice, on the house']), body: `${tip}.`, tail: `Little things like this are why folks in ${city} call us first. Questions? We\'re always happy to answer.` };
      }
      case 'promo': {
        const offer = biz.offer && biz.offer.trim() ? biz.offer.trim() : `10% off your first ${pick(t.services)}`;
        return { headline: pick(['This week only 🎉', 'A little something for you', 'Book this week & save', 'Our neighbors get the good deals']), body: `${offer}.`, tail: `Spots are limited and they go fast. Lock yours in before they\'re gone.` };
      }
      case 'seasonal': {
        const s = t.seasonal[season()];
        return { headline: pick([cap(season()) + ' is here', 'Seasonal heads-up', 'Right on time', 'A timely reminder']), body: s, tail: `We\'ll get you sorted — book before the season gets busy.` };
      }
      case 'review': {
        return { headline: pick(['Loved working with us? 🙏', 'Your words mean the world', 'A small favor', 'Help a neighbor find us']), body: `If we\'ve earned it, a quick Google review helps more than you know — it\'s how new neighbors in ${city} find a business they can trust.`, tail: `Thirty seconds of your time, a huge lift for a local business. Thank you! ⭐⭐⭐⭐⭐` };
      }
      case 'testimonial': {
        return { headline: pick(['Why we do this ❤️', 'Reviews like this made our week', 'This is the good stuff', 'From a happy neighbor']), body: `"${pick(['Honestly the best in town.', 'Fast, fair, and friendly — exactly what you want.', 'Wouldn\'t go anywhere else now.', 'They treated me like family.'])} ${cap(t.review)}."`, tail: `Real people, real results. We\'d love for you to be the next story we get to tell.` };
      }
      case 'faq': {
        const [q, a] = pick(t.faqs);
        return { headline: 'You asked, we answered 👇', body: `Q: ${q}\nA: ${a}`, tail: `Got another question? Ask away — no question is too small.` };
      }
      case 'story': {
        return { headline: pick(['Behind the scenes 🎬', 'A day in the life', 'Meet the team', 'The stuff you don\'t see']), body: pick([`Early mornings, ${pick(t.services)}, and a lot of coffee — that\'s a normal day at ${name}.`, `The team was at it before sunrise today making sure every ${pick(t.services).replace(/s$/, '')} was done right.`, `People ask what makes ${name} different. It\'s simple: we treat your job like it\'s our own.`]), tail: `We love what we do, and it shows. Come see for yourself.` };
      }
      case 'community':
      default: {
        return { headline: pick(['Proudly local 🏡', `Love where we live`, 'Small business, big heart', 'This is home']), body: pick([`We\'re proud to call ${city} home. When you support ${name}, you\'re keeping money and jobs right here in the neighborhood.`, `${city} has the best neighbors — thank you for making ${name} part of the community.`, `Shop small, shop local. Every visit to ${name} supports a real family, not a faceless chain.`]), tail: `Thank you for choosing local. It means everything. 🙌` };
      }
    }
  }

  /* ----------  Assembly per platform + tone  ---------- */
  function assemble(biz, typeKey, platformKey) {
    const t = TYPES[biz.type] || TYPES.other;
    const P = PLATFORMS[platformKey] || PLATFORMS.instagram;
    const toneKey = TONES[biz.tone] ? biz.tone : 'friendly';
    const tone = TONES[toneKey];
    const parts = buildBody(biz, typeKey);
    const stripEmoji = (s) => s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}⭐⭕]/gu, '').replace(/\s{2,}/g, ' ').trim();

    let headline = parts.headline;
    let body = parts.body;
    let tail = parts.tail;
    const cta = P.ctaStyle === 'button' ? ctaButton(biz) : inlineCta(biz);

    let text;
    if (platformKey === 'google') {
      // Concise, keyword-rich, no hashtags/emoji, explicit CTA button.
      const kw = (t.keywords[0] || 'local service');
      const locLine = biz.city ? ` Serving ${biz.city} and nearby.` : '';
      text = `${stripEmoji(headline)}. ${stripEmoji(body)}${locLine}`.replace(/\.\./g, '.').trim();
    } else {
      // Social: opener, body, tail, sign-off. Emoji only if tone allows.
      const opener = chance(0.6) ? tone.openers[Math.floor(Math.random() * tone.openers.length)] : '';
      const signoff = chance(0.7) ? tone.signoffs[Math.floor(Math.random() * tone.signoffs.length)] : '';
      let lines = [opener, headline, '', body, '', tail];
      if (P.ctaStyle === 'inline') lines.push(cta);
      if (signoff) lines.push(signoff);
      text = lines.filter((l) => l !== undefined && l !== null).join('\n').replace(/\n{3,}/g, '\n\n').trim();
      if (!tone.emoji) text = stripEmoji(text);
    }

    // Hashtags
    let tags = [];
    if (P.maxTags > 0) tags = hashtags(biz, typeKey).slice(0, P.maxTags);

    // Image / photo idea to guide the owner
    const imageIdeas = {
      tip: `A clean close-up of your work — ${pick(t.services)} in action`,
      promo: `Bright shot of your offer with clear, readable text overlay`,
      seasonal: `A seasonal photo of your storefront or team, ${season()} vibes`,
      review: `A 5-star graphic or a smiling happy customer (with permission)`,
      testimonial: `The review as a clean quote card, or the customer with their result`,
      faq: `A simple text graphic with the question, or you on camera answering`,
      story: `A candid, unposed photo of the team mid-work — authenticity wins`,
      community: `Your team out in ${biz.city || 'the neighborhood'}, or a local landmark`,
    };

    const typeLabel = (CONTENT_TYPES.find((c) => c.key === typeKey) || {}).label || cap(typeKey);
    return {
      platform: platformKey,
      platformLabel: P.label,
      type: typeKey,
      typeLabel,
      body: text,
      hashtags: tags,
      cta: P.ctaStyle === 'button' ? cta : '',
      imageIdea: imageIdeas[typeKey] || imageIdeas.story,
      charCount: text.length,
    };
  }

  /* ----------  Public API  ---------- */
  function generateOne(biz, opts = {}) {
    const platform = opts.platform || pick(Object.keys(PLATFORMS));
    const type = opts.type || pick(CONTENT_TYPES).key;
    return assemble(biz, type, platform);
  }

  // A balanced weekly batch: mix of content types across the business's
  // active channels, weighted toward value (tips/seasonal) over selling.
  function generateWeek(biz, opts = {}) {
    const platforms = (opts.platforms && opts.platforms.length ? opts.platforms : Object.keys(PLATFORMS));
    const count = opts.count || 5;
    // A sensible content mix for a local business week.
    const mix = ['tip', 'seasonal', 'promo', 'testimonial', 'faq', 'story', 'community', 'review'];
    const posts = [];
    for (let i = 0; i < count; i++) {
      const type = mix[i % mix.length];
      const platform = platforms[i % platforms.length];
      posts.push(assemble(biz, type, platform));
    }
    return posts;
  }

  /* ==========================================================================
     AI layer — talks to the backend proxy (/api/*) when a key is configured,
     and transparently falls back to the local template engine above whenever
     the API is unavailable, unconfigured, or errors. The app never breaks.
     ========================================================================== */
  const aiState = { enabled: false, model: null };

  async function refreshMode() {
    try {
      const r = await fetch('/api/status');
      if (!r.ok) throw new Error('status');
      const j = await r.json();
      aiState.enabled = !!j.configured;
      aiState.model = j.model || null;
    } catch (e) {
      aiState.enabled = false;
      aiState.model = null;
    }
    return aiState;
  }

  async function apiGenerate(payload) {
    const r = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error('generate failed');
    return r.json();
  }

  // Turn the AI's raw {body, hashtags, cta, imageIdea} into the full post shape,
  // applying the same platform rules the template engine uses.
  function finalizeDraft(biz, typeKey, platformKey, ai) {
    const P = PLATFORMS[platformKey] || PLATFORMS.instagram;
    const typeLabel = (CONTENT_TYPES.find((c) => c.key === typeKey) || {}).label || cap(typeKey);
    let hashtags = Array.isArray(ai.hashtags) ? ai.hashtags.filter(Boolean).map((t) => (String(t).startsWith('#') ? t : '#' + t)) : [];
    hashtags = P.maxTags > 0 ? hashtags.slice(0, P.maxTags) : [];
    const body = String(ai.body || '').trim();
    return {
      platform: platformKey, platformLabel: P.label,
      type: typeKey, typeLabel,
      body, hashtags,
      cta: platformKey === 'google' ? (String(ai.cta || '').trim() || 'Learn more') : '',
      imageIdea: String(ai.imageIdea || '').trim() || `A clean, real photo of your team or your work — ${biz.city || 'local'} vibes`,
      charCount: body.length,
    };
  }

  const WEEK_MIX = ['tip', 'seasonal', 'promo', 'testimonial', 'faq', 'story', 'community', 'review'];
  function planWeek(platforms, count) {
    const plan = [];
    for (let i = 0; i < count; i++) plan.push({ type: WEEK_MIX[i % WEEK_MIX.length], platform: platforms[i % platforms.length] });
    return plan;
  }

  // Async: AI when available, template otherwise.
  async function composeOne(biz, opts = {}) {
    const platform = opts.platform || pick(Object.keys(PLATFORMS));
    const type = opts.type || pick(CONTENT_TYPES).key;
    if (aiState.enabled) {
      try {
        const j = await apiGenerate({ business: biz, type, platform });
        if (j && j.configured !== false && j.post) return finalizeDraft(biz, type, platform, j.post);
      } catch (e) { /* fall back to template */ }
    }
    return assemble(biz, type, platform);
  }

  async function composeWeek(biz, opts = {}) {
    const platforms = (opts.platforms && opts.platforms.length ? opts.platforms : Object.keys(PLATFORMS));
    const count = opts.count || 5;
    const plan = planWeek(platforms, count);
    if (aiState.enabled) {
      try {
        const j = await apiGenerate({ business: biz, plan });
        if (j && j.configured !== false && Array.isArray(j.posts) && j.posts.length === plan.length) {
          return plan.map((slot, i) => finalizeDraft(biz, slot.type, slot.platform, j.posts[i]));
        }
      } catch (e) { /* fall back to template */ }
    }
    return plan.map((slot) => assemble(biz, slot.type, slot.platform));
  }

  window.Generator = {
    TYPES, TONES, PLATFORMS, CONTENT_TYPES,
    typeOptions: () => Object.keys(TYPES).map((k) => ({ value: k, label: TYPES[k].label })),
    toneOptions: () => Object.keys(TONES).map((k) => ({ value: k, label: cap(k) })),
    platformOptions: () => Object.keys(PLATFORMS).map((k) => ({ value: k, label: PLATFORMS[k].label })),
    contentTypeOptions: () => CONTENT_TYPES.map((c) => ({ value: c.key, label: c.label })),
    servicesFor: (type) => (TYPES[type] || TYPES.other).services,
    // Sync template engine (used for seed data + offline fallback)
    generateOne, generateWeek, season,
    // Async AI-or-template layer (used by the app at runtime)
    composeOne, composeWeek, refreshMode, mode: () => aiState,
  };
})();

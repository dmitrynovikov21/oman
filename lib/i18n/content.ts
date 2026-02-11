/**
 * Bilingual content data — sourced from client document
 * "Tilqai Website Content bilingual (2).docx"
 */

// ─── HERO ────────────────────────────────────────────
export const heroContent = {
    badge: { en: 'Based in Oman', ar: 'مقرنا في عُمان' },
    headline: { en: 'What if your work runs by itself.', ar: 'ماذا لوعملك يتم انجازه تلقائياً.' },
    subheadline: {
        en: 'We map, fix, and automate the work that slows you down.',
        ar: 'نحدد ما يبطّئ أداءك، ونصلحه، ونحوّله إلى تشغيل تلقائي',
    },
    cta: { en: 'Schedule a free assessment', ar: 'احجز التقييم المجاني' },
};

// ─── THE REALITY ─────────────────────────────────────
export const realityContent = {
    headline: { en: 'The Reality', ar: 'الواقع الحالي' },
    body: {
        en: 'Most teams spend hours every week on work that should not need a person. Writing proposals, screening CVs, moving data across systems, and checking compliance.',
        ar: 'معظم الفرق تهدر ساعات أسبوعياً في أعمال لا تحتاج لتدخل بشري. كتابة عروض الخدمات، فرز السير الذاتية، نقل البيانات بين الأنظمة، ومراجعة الامتثال.',
    },
    hookLine1: { en: 'You do not need more people.', ar: 'أنت لست بحاجة لمزيد من الموظفين.' },
    hookLine2: {
        en: 'You need a workflow that does not break.',
        ar: 'أنت بحاجة لنظام عمل لا يتعطل.',
    },
    cta: { en: 'See applications', ar: 'اكتشف مجالات الاتمتة' },
};

// ─── APPLICATIONS ────────────────────────────────────
export const applicationsContent = {
    sectionTitle: { en: 'What becomes automatic', ar: 'ما الذي يصبح تلقائياً' },
    items: [
        {
            title: { en: 'Workflow Automation', ar: 'أتمتة سير العمل' },
            description: {
                en: 'Intake to structured records. Routing, status updates, and full audit trails. Result is fewer delays.',
                ar: 'من الإدخال إلى السجلات المنظمة. توجيه المهام وتحديثات الحالة وسجل تدقيق كامل. النتيجة تأخير أقل.',
            },
        },
        {
            title: { en: 'CRM Automation', ar: 'أتمتة إدارة العملاء' },
            description: {
                en: 'Lead qualification, auto-logging, and pipeline reporting without extra admin.',
                ar: 'تأهيل العملاء وتسجيل البيانات وتقارير المبيعات آلياً دون عبء إداري.',
            },
        },
        {
            title: { en: 'HR Management', ar: 'إدارة الموارد البشرية' },
            description: {
                en: 'Workforce Planning to Off-boarding and every routine task in between',
                ar: 'من تخطيط الاحتياجات الوظيفية إلى إنهاء الخدمة وكل المهام الروتينية بينهما',
            },
        },
        {
            title: { en: 'Support Desk', ar: 'الدعم الفني' },
            description: {
                en: 'Auto-responses and ticket routing without losing quality.',
                ar: 'ردود آلية ذكية وتوجيه التذاكر للمختصين لضمان سرعة الاستجابة.',
            },
        },
        {
            title: { en: 'Compliance', ar: 'الامتثال' },
            description: {
                en: 'Enforced steps, logs, checklists, and regulatory reporting.',
                ar: 'خطوات إجبارية وقوائم تحقق آلية وتقارير رقابية دقيقة.',
            },
        },
    ],
};

// ─── HOW WE DELIVER ──────────────────────────────────
export const howWeDeliverContent = {
    headline: { en: 'How we deliver', ar: 'منهجية العمل' },
    subtitle: { en: 'From first call to daily use', ar: 'من أول مكالمة إلى الاستخدام اليومي' },
    phases: [
        {
            num: '01',
            title: { en: 'Assessment', ar: 'التقييم' },
            subtitle: { en: 'We learn how your business runs', ar: 'نتعلم كيف يعمل نشاطك التجاري' },
            description: {
                en: 'We map your processes, find bottlenecks, see where data lives. We figure out which tasks AI can take over and what results to expect.',
                ar: 'نرسم خريطة عملياتك ونجد نقاط الاختناق ونحدد أين توجد البيانات. نحدد المهام التي يمكن للذكاء الاصطناعي تولّيها والنتائج المتوقعة.',
            },
        },
        {
            num: '02',
            title: { en: 'Build & Connect', ar: 'البناء والربط' },
            subtitle: { en: 'We build the system and plug it in', ar: 'نبني النظام ونوصله' },
            description: {
                en: 'Custom AI for your tasks. Connected to your tools, your data, your workflows. Works inside your existing setup.',
                ar: 'ذكاء اصطناعي مخصص لمهامك. متصل بأدواتك وبياناتك وسير عملك. يعمل داخل بنيتك الحالية.',
            },
        },
        {
            num: '03',
            title: { en: 'Rules & Control', ar: 'القواعد والتحكم' },
            subtitle: { en: 'We set boundaries and access', ar: 'نضع الحدود وصلاحيات الوصول' },
            description: {
                en: 'Who sees what. What AI can and cannot do. How decisions are logged. Ready for audits from day one.',
                ar: 'من يرى ماذا. ما يستطيع الذكاء الاصطناعي فعله وما لا يستطيع. كيف تُسجَّل القرارات. جاهز للتدقيق من اليوم الأول.',
            },
        },
        {
            num: '04',
            title: { en: 'Training & Launch', ar: 'التدريب والإطلاق' },
            subtitle: { en: 'We train your team until they\nown it', ar: 'ندرب فريقك حتى يتقنه' },
            description: {
                en: 'We roll out gradually. Train people, collect feedback, adjust. Done when your team runs it without us.',
                ar: 'ننشر تدريجياً. ندرب الأشخاص ونجمع الملاحظات ونعدّل. ننتهي عندما يدير فريقك النظام بدوننا.',
            },
        },
    ],
};

// ─── WHY US ──────────────────────────────────────────
export const whyUsContent = {
    headline: { en: 'AI with clear rules and accountability', ar: 'ذكاء اصطناعي بقواعد واضحة ومسؤولية' },
    subtitle: {
        en: 'Every system we deploy operates within defined boundaries, ownership, and responsibility.',
        ar: 'كل نظام ننشره يعمل ضمن حدود واضحة وملكية ومسؤولية محددة.',
    },
    sectionTitle: { en: 'Why tilqai', ar: 'لماذا تلقائي' },
    cards: [
        {
            icon: 'lock',
            title: { en: 'Data integrity and privacy', ar: 'سلامة البيانات والخصوصية' },
            description: {
                en: 'We treat data with the same sanctity as a private space. Systems are designed with security, transparency, and strict access controls at their core.',
                ar: 'نتعامل مع البيانات كمساحة خاصة. أنظمتنا مصممة بالأمان والشفافية وضوابط الوصول الصارمة.',
            },
        },
        {
            icon: 'arrow-up-right',
            title: { en: 'GCC-first approach', ar: 'نهج خليجي أولاً' },
            description: {
                en: 'We know the region. Data sovereignty, Arabic language support, local business practices. Built for companies operating here.',
                ar: 'نعرف المنطقة. سيادة البيانات ودعم اللغة العربية وممارسات الأعمال المحلية.',
            },
        },
        {
            icon: 'layers',
            title: { en: 'We stay on call', ar: 'نبقى على اتصال' },
            description: {
                en: 'Updates, fixes, adjustments as your business changes. You have direct access to the team that built it.',
                ar: 'تحديثات وإصلاحات وتعديلات مع تغير أعمالك. لديك وصول مباشر للفريق الذي بنى النظام.',
            },
        },
        {
            icon: 'none',
            title: { en: 'It works or we fix it', ar: 'يعمل أو نصلحه' },
            description: {
                en: "Something breaks, we're on it.",
                ar: 'إذا حدث عطل، نحن هنا.',
            },
            isAccent: true,
        },
    ],
};

// ─── INDUSTRIES ──────────────────────────────────────
export const industriesContent = {
    headline: { en: 'Industries we work with', ar: 'القطاعات التي نعمل معها' },
    items: [
        {
            title: { en: 'Regulated industries', ar: 'القطاعات الخاضعة للوائح' },
            description: {
                en: 'Healthcare, finance, legal. Where compliance matters and errors cost.',
                ar: 'الرعاية الصحية، المالية، القانون. حيث الامتثال مهم والأخطاء مكلفة.',
            },
            icon: '/5screen/icons 1.png',
        },
        {
            title: { en: 'Government', ar: 'القطاع الحكومي' },
            description: {
                en: 'Systems that handle citizen-facing processes. Transparent, auditable, built for public accountability.',
                ar: 'أنظمة تتعامل مع العمليات المواجهة للمواطنين. شفافة وقابلة للتدقيق ومبنية للمساءلة العامة.',
            },
            icon: '/5screen/icons 2.png',
        },
        {
            title: { en: 'Enterprise', ar: 'المؤسسات الكبرى' },
            description: {
                en: 'Systems for mid-size and large companies. Back-office operations that scale without adding headcount.',
                ar: 'أنظمة للشركات المتوسطة والكبيرة. عمليات المكتب الخلفي التي تتوسع دون زيادة عدد الموظفين.',
            },
            icon: '/5screen/icons 3.png',
        },
    ],
};

// ─── ASSESSMENT ──────────────────────────────────────
export const assessmentContent = {
    badge: { en: 'Free Assessment', ar: 'التقييم المجاني' },
    headline: { en: 'The Assessment', ar: 'التقييم المجاني' },
    subtitle: { en: '(1 week, No cost)', ar: '(أسبوع واحد، بدون تكلفة)' },
    whatYouGet: {
        title: { en: 'What You Get', ar: 'ما ستحصل عليه' },
        description: {
            en: 'Process map, bottleneck identification, automation plan, and pricing range.',
            ar: 'خارطة للوضع الحالي وتحديد نقاط التحسين وخطة الأتمتة ونطاق الأسعار.',
        },
    },
    whatToPrepare: {
        title: { en: 'What To Prepare', ar: 'المطلوب منك' },
        description: {
            en: 'One example of routine work and 60 minutes for a call.',
            ar: 'مثال واحد لعملية روتينية وساعة واحدة لنقاش التفاصيل.',
        },
    },
    cta: { en: 'Schedule Free Assessment', ar: 'احجز التقييم المجاني' },
};

// ─── FAQs ────────────────────────────────────────────
export const faqContent = {
    headline: { en: 'FAQs', ar: 'الأسئلة الشائعة' },
    items: [
        {
            q: { en: 'What does tilqai mean?', ar: 'ماذا يعني تلقائي؟' },
            a: {
                en: 'Work is handled without manual effort. Humans step in only when judgment is needed.',
                ar: 'أن ينجز العمل دون جهد يدوي ، ويكون التدخل البشري فقط عندما يتطلب الأمر اتخاذ قرار.',
            },
        },
        {
            q: { en: 'Will this replace my team?', ar: 'هل سيستبدل هذا النظام فريقي؟' },
            a: {
                en: 'No. It removes repetitive work so your team can focus on decisions.',
                ar: 'لا. النظام يزيل الأعمال الروتينية ليتفرغ فريقك للقرارات والمهام ذات الاولوية.',
            },
        },
        {
            q: { en: 'How long does it take?', ar: 'كم يستغرق الأمر؟' },
            a: {
                en: 'Simple 4 to 6 weeks. Medium 6 to 10 weeks. Complex 10 to 12 weeks.',
                ar: 'البسيط 4 إلى 6 أسابيع. المتوسط 6 إلى 10 أسابيع. المعقد 10 إلى 12 أسبوعاً.',
            },
        },
        {
            q: { en: 'How much does it cost?', ar: 'كم التكلفة؟' },
            a: {
                en: 'Build is OMR 5,000 to 15,000. Support is OMR 500 to 2,000 per month.\n*Prices may vary depending on scope of work.',
                ar: 'البناء 5,000 إلى 15,000 ريال عماني. الدعم 500 إلى 2,000 ريال عماني شهرياً.\n*تختلف الأسعار بحسب نطاق العمل',
            },
        },
        {
            q: { en: 'Where does the data go?', ar: 'أين تذهب البيانات؟' },
            a: {
                en: 'Deployed in-region when required. Access is controlled and auditable governance.',
                ar: 'محلياً عند الحاجة. وطريقة الوصول للبيانات مراقب بحوكمة وصلاحيات دقيقة.',
            },
        },
    ],
};

// ─── ABOUT + FOUNDER ─────────────────────────────────
export const aboutContent = {
    badge: { en: 'About tilqai', ar: 'عن تلقائي' },
    sections: [
        {
            title: { en: 'What Tilqai Is', ar: 'ما هي تلقائي؟' },
            body: {
                en: 'Tilqai is built by operators with years of experience inside organizations, not by software developers.',
                ar: 'تلقائي خدمة تهدف إلى تحسين طريقة سير العمل داخل المؤسسات. تأسست بخبرة تشغيلية حقيقية، وليس من قبل مطوري برمجيات.',
            },
        },
        {
            title: { en: 'How It Works', ar: 'كيف تعمل؟' },
            body: {
                en: 'We take complex policies and broken workflows, turn them into clear and reliable operations, then build AI steps that run them accurately and safely.',
                ar: 'نراجع سير العمل الفعلي، نحدد مواضع التعطل، ونعيد بناء العملية لتصبح واضحة وامكانية الاعتماد عليها. بعدها نضيف خطوات ذكية تعمل تلقائياً على المهام الروتينية بدقة وأمان.',
            },
        },
        {
            title: { en: 'Why It Exists', ar: 'لماذا وُجدت؟' },
            body: {
                en: 'To remove the daily friction caused by unclear processes and manual work.',
                ar: 'لأن أغلب المؤسسات لا تحتاج إلى أدوات إضافية، بل إلى مسار عمل يعمل بشكل صحيح دون جهد يدوي مستمر.',
            },
        },
    ],
    founder: {
        label: { en: 'The Founder - Managing Director', ar: 'المؤسس – المدير التنفيذي' },
        name: { en: 'Tariq Al Maskari', ar: 'طارق المسكري' },
        bio: {
            en: 'A professional expert with 15+ years of cross-sector experience. Backed by Harvard Business School leadership executive training, CIPD certification, and accreditation with the Ministry of Justice and Legal Affairs, he delivers systematic business assessments and practical technical solutions with a focus on streamlining operations and driving performance efficiency to meet organizational goals.',
            ar: 'خبير مهني يتمتع بأكثر من 15 عاماً من الخبرات في مؤسسات بقطاعات مختلفة، ويحمل مؤهلات قيادية من كلية هارفرد للأعمال وشهادة الموارد البشرية المهنية CIPD، وخبير موارد بشرية مقيد لدى وزارة العدل والشؤون القانونية، يعمل على توفير قراءة ممنهجة لتحسين الأعمال، وتقديم الحلول العملية والتقنية المرتبطة بسلاسة العمليات، ورفع كفاءة الأداء للوصول الى مستهدفات الاعمال العامة بالمؤسسات.',
        },
    },
};

// ─── CONTACT ─────────────────────────────────────────
export const contactContent = {
    headline: { en: 'Your point of contact', ar: 'نقطة اتصالك' },
    subtitle: {
        en: 'Tariq Al-Maskari, founder. He runs implementations from scoping to launch. Direct communication, clear accountability.',
        ar: 'طارق المسكري، المؤسس. يدير التنفيذ من تحديد النطاق حتى الإطلاق. تواصل مباشر ومسؤولية واضحة.',
    },
    info: {
        liveChat: { label: { en: 'Live Chat', ar: 'المحادثة المباشرة' }, value: { en: 'Coming Soon', ar: 'قريباً' } },
        email: { label: { en: 'Email', ar: 'البريد الإلكتروني' }, value: { en: 'hello@tilqai.com', ar: 'hello@tilqai.com' } },
        location: { label: { en: 'Location', ar: 'الموقع' }, value: { en: 'Muscat, Oman', ar: 'مسقط، سلطنة عمان' } },
        languages: { label: { en: 'Languages', ar: 'اللغات المدعومة' }, value: { en: 'Arabic, English', ar: 'العربية، الإنجليزية' } },
    },
    form: {
        name: { en: 'Name', ar: 'الاسم' },
        organization: { en: 'Organization', ar: 'المؤسسة' },
        email: { en: 'Work Email', ar: 'البريد الإلكتروني للعمل' },
        phone: { en: 'Phone Number', ar: 'رقم الهاتف' },
        message: { en: 'Tell us about your situation', ar: 'حدثنا عن التحدي الذي تواجهه' },
        placeholder: {
            en: 'Describe the workflows that slow you down, the bottlenecks you want to fix, or the outcomes you are looking to achieve.',
            ar: 'صف مسارات العمل التي تعيق تقدمك، أو نقاط التعطل التي ترغب في إصلاحها، أو النتائج التي تطمح لتحقيقها.',
        },
        submit: { en: 'Send Inquiry', ar: 'أرسل الطلب' },
    },
    nextSteps: {
        title: { en: 'What happens next?', ar: 'ماذا بعد إرسال الطلب؟' },
        steps: [
            { en: 'We review your inquiry within 24 hours.', ar: 'نقوم بمراجعة طلبك خلال 24 ساعة.' },
            { en: 'We schedule a discovery call.', ar: 'نجدول مكالمة تعريفية' },
            { en: 'We map your process and provide an automation plan.', ar: 'نرسم مسار عملك ونقدم لك خطة أتمتة واضحة.' },
        ],
    },
};

// ─── FOOTER ──────────────────────────────────────────
export const footerContent = {
    tagline: { en: 'Technology for human clarity', ar: 'تقنية من أجل وضوح العمل البشري' },
    location: { en: 'Based in Oman', ar: 'مقرنا في عُمان' },
    copyright: { en: '© 2026 tilqai', ar: '© 2026 تلقائي' },
    privacy: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
    terms: { en: 'Terms', ar: 'الشروط والأحكام' },
    rights: { en: 'All rights reserved', ar: 'جميع الحقوق محفوظة' },
};

// ─── COMMON / NAV ────────────────────────────────────
export const navContent = {
    ctaBar: { en: 'AI that fits your organization', ar: 'ذكاء اصطناعي يناسب مؤسستك' },
    ctaButton: { en: 'Book a call', ar: 'احجز مكالمة' },
};

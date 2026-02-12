'use client';

import { useState } from 'react';
import { Clock, TrendingDown, Zap, Calculator, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import { roiContent } from '@/lib/i18n/content';

/* ─── Calculation Logic ───────────────────────────────── */
interface ROIInputs {
    teamSize: number;
    monthlySalary: number;
    weeklyHours: number;
    workflowSteps: number;
}

interface ROIResults {
    monthlySavings: number;
    paybackMonths: number;
    hoursSaved: number;
    delayReduction: number;
}

function calculateROI(inputs: ROIInputs): ROIResults {
    const { teamSize, monthlySalary, weeklyHours, workflowSteps } = inputs;

    const automationRates: Record<number, number> = { 3: 0.35, 5: 0.45, 7: 0.55, 10: 0.65 };
    const automationRate = automationRates[workflowSteps] ?? 0.45;

    const monthlyHoursPerPerson = weeklyHours * 4.33;
    const totalMonthlyHours = monthlyHoursPerPerson * teamSize;
    const hoursSaved = Math.round(totalMonthlyHours * automationRate);

    const hourlyRate = monthlySalary / 160;
    const monthlySavings = Math.round(hourlyRate * hoursSaved);

    const implementationCost = 10000;
    const paybackMonths = +(implementationCost / Math.max(monthlySavings, 1)).toFixed(1);

    const delayRates: Record<number, number> = { 3: 0.35, 5: 0.53, 7: 0.62, 10: 0.75 };
    const delayReduction = Math.round((delayRates[workflowSteps] ?? 0.53) * 100);

    return { monthlySavings, paybackMonths, hoursSaved, delayReduction };
}

/* ─── Metric Cards Data ───────────────────────────────── */
const metrics = [
    {
        icon: Clock,
        value: '20–80',
        unit: { en: 'HRS / MONTH', ar: 'ساعة / شهر' },
        title: { en: 'Hours Saved Monthly', ar: 'ساعات موفّرة شهرياً' },
        description: {
            en: 'Teams save 20–80 hours every month by removing routine tasks.',
            ar: 'توفر الفرق من 20 إلى 80 ساعة شهرياً بإزالة المهام الروتينية.',
        },
    },
    {
        icon: TrendingDown,
        value: '15–35%',
        unit: { en: 'COST REDUCTION', ar: 'خفض التكاليف' },
        title: { en: 'Operational Cost Reduction', ar: 'خفض تكاليف التشغيل' },
        description: {
            en: 'Automation reduces 15–35% of back-office operational cost without reducing headcount.',
            ar: 'تقلل الأتمتة 15-35% من تكاليف التشغيل دون تقليل عدد الموظفين.',
        },
    },
    {
        icon: Zap,
        value: '2–5x',
        unit: { en: 'FASTER', ar: 'أسرع' },
        title: { en: 'Faster Cycle Time', ar: 'وقت دورة أسرع' },
        description: {
            en: 'Processes become 2–5x faster with enforced steps and automated routing.',
            ar: 'تصبح العمليات أسرع 2-5 مرات مع الخطوات الإلزامية والتوجيه التلقائي.',
        },
    },
];

/* ─── Component ───────────────────────────────────────── */
export default function ROICalculatorSection() {
    const { lang } = useLanguage();
    const t = roiContent;

    const [inputs, setInputs] = useState<ROIInputs>({
        teamSize: 3,
        monthlySalary: 500,
        weeklyHours: 45,
        workflowSteps: 5,
    });

    const [results, setResults] = useState<ROIResults | null>(null);
    const [metricIndex, setMetricIndex] = useState(0);

    const handleCalculate = () => {
        setResults(calculateROI(inputs));
    };

    const updateInput = (key: keyof ROIInputs, value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 0) {
            setInputs(prev => ({ ...prev, [key]: num }));
        }
    };

    return (
        <section className="relative py-24 overflow-hidden">
            {/* Subtle background glow — matches Applications */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-8 max-w-7xl relative z-10">

                {/* ── Header — centered, badge above title like Applications ── */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-3 px-4 py-2 mb-8 border border-[#0164F7]/20 rounded-full bg-transparent shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)]">
                        <span className="text-white/80 text-sm">
                            {t.badge[lang]}
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold text-white">
                        {t.headline[lang]}
                    </h2>
                </div>

                {/* ── Metric Cards — Applications-style cards ── */}
                <div className="relative mb-16">
                    {/* Mobile navigation */}
                    <button
                        onClick={() => setMetricIndex(Math.max(0, metricIndex - 1))}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all lg:hidden"
                        disabled={metricIndex === 0}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setMetricIndex(Math.min(metrics.length - 1, metricIndex + 1))}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all lg:hidden"
                        disabled={metricIndex === metrics.length - 1}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {metrics.map((metric, i) => {
                            const Icon = metric.icon;
                            return (
                                <div
                                    key={i}
                                    className={`group relative p-6 md:p-8 rounded-xl border border-[#0164F7]/20 bg-transparent hover:border-[#0164F7]/35 transition-all duration-500 shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)] ${i !== metricIndex ? 'hidden lg:block' : 'block'
                                        }`}
                                >
                                    {/* Hover glow */}
                                    <div className="absolute inset-0 rounded-xl bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <div className="relative z-10">
                                        {/* Icon + Index */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-12 h-12 rounded-xl bg-[#0a1a3a]/40 backdrop-blur-xl border border-white/5 flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <span className="text-blue-500 text-xs font-medium tracking-wide opacity-80">
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                        </div>

                                        {/* Big value */}
                                        <div className="text-3xl font-bold text-white mb-1">
                                            {metric.value}
                                        </div>
                                        <div className="text-xs font-medium text-white/30 tracking-widest uppercase mb-4">
                                            {metric.unit[lang]}
                                        </div>

                                        {/* Title + Description */}
                                        <h3 className="text-base md:text-lg font-bold text-white mb-2 leading-tight group-hover:text-blue-100 transition-colors">
                                            {metric.title[lang]}
                                        </h3>
                                        <p className="text-white/50 text-xs md:text-sm leading-relaxed">
                                            {metric.description[lang]}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Calculator Form — rounded-xl (50% less radius) ── */}
                <div className="relative rounded-xl border border-[#0164F7]/20 bg-transparent overflow-hidden shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)]">

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 p-8 lg:p-12">

                        {/* Left: Form */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-[#0a1a3a]/40 backdrop-blur-xl border border-white/5 flex items-center justify-center">
                                    <Calculator className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {t.formTitle[lang]}
                                    </h3>
                                    <p className="text-white/40 text-sm">
                                        {t.formSubtitle[lang]}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-5">
                                <CalcInput
                                    label={t.labels.teamSize[lang]}
                                    value={inputs.teamSize}
                                    onChange={(v) => updateInput('teamSize', v)}
                                />
                                <CalcInput
                                    label={t.labels.salary[lang]}
                                    value={inputs.monthlySalary}
                                    onChange={(v) => updateInput('monthlySalary', v)}
                                />
                                <CalcInput
                                    label={t.labels.weeklyHours[lang]}
                                    value={inputs.weeklyHours}
                                    onChange={(v) => updateInput('weeklyHours', v)}
                                />

                                {/* Workflow Steps Dropdown */}
                                <div>
                                    <label className="block text-white/50 text-sm mb-2">
                                        {t.labels.workflowSteps[lang]}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={inputs.workflowSteps}
                                            onChange={(e) => updateInput('workflowSteps', e.target.value)}
                                            className="w-full appearance-none bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3.5 text-white text-base focus:outline-none focus:border-blue-500/30 transition-colors cursor-pointer"
                                        >
                                            <option value={3}>3 {t.labels.steps[lang]}</option>
                                            <option value={5}>5 {t.labels.steps[lang]}</option>
                                            <option value={7}>7 {t.labels.steps[lang]}</option>
                                            <option value={10}>10 {t.labels.steps[lang]}</option>
                                        </select>
                                        <ChevronRight className="absolute end-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 rotate-90 pointer-events-none" />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCalculate}
                                    className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-[#0066FF] text-white font-medium rounded-full hover:bg-[#0052cc] transition-colors shadow-lg shadow-blue-500/20 mt-2"
                                >
                                    <Calculator className="w-4 h-4" />
                                    {t.calculateBtn[lang]}
                                </button>
                            </div>
                        </div>

                        {/* Right: Results */}
                        <div>
                            <div className="text-xs font-medium text-white/40 tracking-widest uppercase mb-6">
                                {t.resultsTitle[lang]}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <ResultCard
                                    value={results ? `${results.monthlySavings}` : '—'}
                                    unit="OMR"
                                    label={t.results.savings[lang]}
                                    highlight
                                />
                                <ResultCard
                                    value={results ? `${results.paybackMonths}` : '—'}
                                    unit={t.results.monthsUnit[lang]}
                                    label={t.results.payback[lang]}
                                />
                                <ResultCard
                                    value={results ? `${results.hoursSaved}` : '—'}
                                    unit={t.results.hrsUnit[lang]}
                                    label={t.results.hoursSaved[lang]}
                                />
                                <ResultCard
                                    value={results ? `${results.delayReduction}%` : '—'}
                                    unit=""
                                    label={t.results.delayReduction[lang]}
                                />
                            </div>

                            <a
                                href="#contact"
                                className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-[#0066FF] text-white text-base font-medium rounded-full hover:bg-[#0052cc] transition-colors"
                            >
                                <span>{t.reportBtn[lang]}</span>
                                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                            </a>

                            <p className="text-white/30 text-xs text-center mt-4">
                                {t.disclaimer[lang]}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── Sub-components ──────────────────────────────────── */

function CalcInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (v: string) => void;
}) {
    return (
        <div>
            <label className="block text-white/50 text-sm mb-2">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3.5 text-white text-base focus:outline-none focus:border-blue-500/30 transition-colors"
            />
        </div>
    );
}

function ResultCard({
    value,
    unit,
    label,
    highlight,
}: {
    value: string;
    unit: string;
    label: string;
    highlight?: boolean;
}) {
    return (
        <div className={`rounded-lg border border-[#0164F7]/15 bg-transparent p-5 transition-all shadow-[0_0_10px_rgba(1,100,247,0.05)] ${highlight ? 'border-[#0164F7]/30' : ''
            }`}>
            <div className="flex items-baseline gap-1.5 mb-1">
                <span className={`text-2xl font-bold ${highlight ? 'text-white' : 'text-white'}`}>{value}</span>
                {unit && <span className="text-sm text-white/40">{unit}</span>}
            </div>
            <p className="text-white/50 text-sm">{label}</p>
        </div>
    );
}

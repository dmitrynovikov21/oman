import type { Case } from './types';

export const mockCases: Case[] = [
  {
    id: '1',
    caseNumber: '123/456/2024',
    court: 'Muscat Primary Court',
    plaintiff: 'Ahmed Al-Harthy',
    defendant: 'Gulf Tech LLC',
    status: 'Processing',
    updatedAt: '2024-11-10',
    documents: [
      {
        id: 'd1',
        name: 'court_appointment_order.pdf',
        type: 'pdf',
        category: 'court',
        status: 'parsed',
      },
      {
        id: 'd2',
        name: 'employment_contract.pdf',
        type: 'pdf',
        category: 'plaintiff',
        status: 'ocr_done',
      },
      {
        id: 'd3',
        name: 'salary_slips.zip',
        type: 'docx',
        category: 'plaintiff',
        status: 'uploaded',
      },
      {
        id: 'd4',
        name: 'termination_letter_scan.jpg',
        type: 'image',
        category: 'defendant',
        status: 'ocr_pending',
      },
    ],
    extractedData: {
      caseNumber: '123/456/2024',
      appointmentDate: '2024-11-15',
      court: 'Muscat Primary Court',
      plaintiff: 'Ahmed Al-Harthy',
      defendant: 'Gulf Tech LLC',
      disputeSubject: 'Unlawful termination and unpaid salaries',
      expertAssignment: 'Review employment relation and financial entitlements',
    },
    analysis: {
      summary: [
        '3 main financial claims identified.',
        'Potential unlawful termination risk detected.',
        'Key discrepancies in salary payment timeline.',
      ],
      claims: [
        {
          id: 'c1',
          description: 'Unpaid salary for last 3 months',
          claimedAmount: '1,200 OMR',
          defendantPosition: 'Company alleges resignation without notice.',
          conflictLevel: 'strong',
        },
      ],
      financialSummary: {
        unpaidSalary: '1,200 OMR',
        unusedLeave: '450 OMR',
        endOfService: '3,200 OMR',
      },
    },
    report: {
      htmlContent: '<p>Mock HTML content for demo purposes.</p>', // Added this line
      arabicSections: [
        {
          id: 'assignment',
          title: 'المأمورية',
          body:
            'كلّفت المحكمة الخبير بدراسة علاقة العمل بين الطرفين وبيان المستحقات المالية للعامل وفقاً لأحكام قانون العمل العماني.',
        },
      ],
    },
    manualMeetingNotes:
      'Meeting with plaintiff on 12 Nov: claims unpaid salary for 3 months, alleges termination without prior warning. Employer insists on voluntary resignation.',
  },
];

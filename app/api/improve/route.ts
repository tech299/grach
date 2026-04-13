import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const MOCK = {
  original_score: 61,
  improved_score: 89,
  criteria: [
    {
      name: 'Clear thesis',
      status_before: 'missing',
      status_after: 'met',
      reason: 'The thesis is now specific, arguable, and stated in the first paragraph.',
      changes_made: 'Rewrote vague opening claim into a direct argument.'
    },
    {
      name: 'Evidence and analysis',
      status_before: 'partial',
      status_after: 'met',
      reason: 'Each body paragraph now includes analysis tied to the claim.',
      changes_made: 'Inserted analysis sentences after examples.'
    },
    {
      name: 'Organization and transitions',
      status_before: 'partial',
      status_after: 'met',
      reason: 'Topic sentences and transitions now connect ideas clearly.',
      changes_made: 'Added transition phrases and tightened paragraph openings.'
    }
  ],
  missing_information: [
    'Teacher citation format is not specified (MLA/APA/Chicago).',
    'A direct quote source is mentioned but full citation details are missing.'
  ],
  improved_draft:
    'Social media can improve student learning when used intentionally. This essay argues that guided use of social platforms strengthens collaboration, reflection, and independent practice. For example, class discussion threads let students test ideas before writing formal essays, which deepens reasoning before final submission. In addition, short instructional videos help visual learners review difficult topics independently. As a result, these tools work best when paired with clear expectations and teacher modeling. Therefore, schools should teach structured digital literacy rather than banning platforms outright.',
  changes: [
    {
      id: 'c1',
      type: 'modification',
      original_text: 'Social media affects students in many ways.',
      new_text: 'This essay argues that guided use of social platforms strengthens collaboration, reflection, and independent practice.',
      reason: 'Rubric requires a clear, arguable thesis.',
      criterion: 'Clear thesis',
      impact: 'high'
    },
    {
      id: 'c2',
      type: 'addition',
      original_text: '',
      new_text: 'which deepens reasoning before final submission.',
      reason: 'Added analysis to explain why evidence supports the claim.',
      criterion: 'Evidence and analysis',
      impact: 'high'
    },
    {
      id: 'c3',
      type: 'modification',
      original_text: 'Also, videos are useful.',
      new_text: 'As a result, these tools work best when paired with clear expectations and teacher modeling.',
      reason: 'Improves flow and transition quality across paragraphs.',
      criterion: 'Organization and transitions',
      impact: 'medium'
    }
  ],
  insight:
    'Your draft now meets most major rubric criteria. Minor improvements remain around source formatting and citation specificity.'
};

export async function POST(req: Request) {
  const { input } = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(MOCK);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            'You are FullMarks, an assignment optimizer. Improve rubric fit, preserve voice, do not fabricate citations/quotes/stats/sources, and return strict JSON matching the schema.'
        },
        {
          role: 'user',
          content: `Input blob:\n${input}\n\nReturn JSON with keys: original_score, improved_score, criteria[], missing_information[], improved_draft, changes[], insight, prompt, rubric, original_draft. For changes include id and impact(high/medium/minor).`
        }
      ],
      text: {
        format: {
          type: 'json_object'
        }
      }
    });

    const raw = completion.output_text;
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(MOCK);
  }
}

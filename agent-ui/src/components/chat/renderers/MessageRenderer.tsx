import { MessageEvent, QuestionOutput } from '../../../types/events';
import { Expandable } from '../components/Expandable';
import ReactMarkdown from 'react-markdown';

export function MessageRenderer({ event }: { event: MessageEvent }) {
  try {
    const content = JSON.parse(event.message.content) as QuestionOutput;
    return (
      <div className="space-y-2">
        <div className="font-semibold text-gray-800">{content.question_title}</div>
        <div className="text-gray-600 prose prose-invert max-w-none">
          <ReactMarkdown>{content.answer}</ReactMarkdown>
        </div>
        {content.chain_of_thoughts && (
          <div className='text-gray-600'>
            <Expandable title="Show reasoning...">
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{content.chain_of_thoughts}</ReactMarkdown>
              </div>
            </Expandable>
          </div>
        )}
      </div>
    );
  } catch (e) {
    return (
      <div className="text-gray-300">
        <span className="font-semibold">{event.message.role}: </span>
        {event.message.content}
      </div>
    );
  }
}
